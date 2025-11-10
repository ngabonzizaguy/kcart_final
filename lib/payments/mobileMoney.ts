// Mobile Money Payment Integration (MTN & Airtel)
// Supports mock mode for testing and live mode for production

import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';

export type PaymentProvider = 'mtn' | 'airtel';
export type PaymentStatus = 'pending' | 'success' | 'failed';

interface PaymentResult {
  transactionId: string;
  status: PaymentStatus;
  message?: string;
}

interface MTNConfig {
  baseUrl: string;
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnvironment: string;
  currency: string;
  callbackUrl?: string;
}

interface MTNRequestToPayResponse {
  transactionId: string;
  status: PaymentStatus;
  rawStatus: string;
}

const tokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0,
};

function getMtnConfig(): MTNConfig {
  const baseUrl = process.env.MOMO_BASE_URL;
  const subscriptionKey = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY;
  const apiUser = process.env.MOMO_COLLECTION_API_USER;
  const apiKey = process.env.MOMO_COLLECTION_API_KEY;
  const targetEnvironment = process.env.MOMO_TARGET_ENV;
  const currency = process.env.MOMO_CURRENCY || 'RWF';

  if (!baseUrl) throw new Error('Missing MOMO_BASE_URL environment variable');
  if (!subscriptionKey) throw new Error('Missing MOMO_COLLECTION_SUBSCRIPTION_KEY environment variable');
  if (!apiUser) throw new Error('Missing MOMO_COLLECTION_API_USER environment variable');
  if (!apiKey) throw new Error('Missing MOMO_COLLECTION_API_KEY environment variable');
  if (!targetEnvironment) throw new Error('Missing MOMO_TARGET_ENV environment variable');

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    subscriptionKey,
    apiUser,
    apiKey,
    targetEnvironment,
    currency,
    callbackUrl: process.env.MOMO_CALLBACK_URL,
  };
}

function sanitizeMsisdn(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  if (!digits) {
    throw new Error('Phone number missing digits');
  }

  // Rwanda MSISDNs typically start with 07 / 078 / 079 or already include 250
  if (digits.startsWith('0') && digits.length === 10) {
    return `25${digits.substring(1)}`;
  }

  if (digits.length === 9) {
    return `250${digits}`;
  }

  return digits;
}

async function getMtnAccessToken(config: MTNConfig): Promise<string> {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }

  const authString = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString('base64');

  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      'Content-Length': '0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain MTN access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const accessToken = data.access_token as string | undefined;
  const expiresIn = Number(data.expires_in || 0);

  if (!accessToken) {
    throw new Error('MTN token response missing access_token');
  }

  tokenCache.token = accessToken;
  tokenCache.expiresAt = Date.now() + (expiresIn ? expiresIn * 1000 : 300000);

  return accessToken;
}

function mapMtnStatus(status: string): PaymentStatus {
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCESSFUL') return 'success';
  if (normalized === 'FAILED') return 'failed';
  return 'pending';
}

async function requestToPay(
  config: MTNConfig,
  token: string,
  payload: {
    referenceId: string;
    amount: number;
    currency: string;
    msisdn: string;
    externalId: string;
    payerMessage: string;
    payeeNote: string;
  }
): Promise<MTNRequestToPayResponse> {
  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Reference-Id': payload.referenceId,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      'Content-Type': 'application/json',
      ...(config.callbackUrl ? { 'X-Callback-Url': config.callbackUrl } : {}),
    },
    body: JSON.stringify({
      amount: payload.amount.toFixed(2),
      currency: payload.currency,
      externalId: payload.externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: payload.msisdn,
      },
      payerMessage: payload.payerMessage,
      payeeNote: payload.payeeNote,
    }),
  });

  if (response.status !== 202) {
    const errorBody = await response.text();
    throw new Error(`MTN request to pay failed: ${response.status} ${errorBody}`);
  }

  return {
    transactionId: payload.referenceId,
    status: 'pending',
    rawStatus: 'PENDING',
  };
}

async function fetchMtnTransactionStatus(
  config: MTNConfig,
  token: string,
  referenceId: string
): Promise<MTNRequestToPayResponse> {
  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch MTN transaction status: ${response.status} ${errorBody}`);
  }

  const body = await response.json();
  const rawStatus = (body.status as string) || 'PENDING';

  return {
    transactionId: referenceId,
    status: mapMtnStatus(rawStatus),
    rawStatus,
  };
}

/**
 * Generate a mock transaction ID
 */
function generateMockTransactionId(provider: PaymentProvider): string {
  const prefix = provider.toUpperCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11).toUpperCase();
  return `${prefix}-MOCK-${timestamp}-${random}`;
}

/**
 * Simulate payment processing delay
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock payment flow for testing
 * Simulates pending → success/failed transition
 */
export async function mockPaymentFlow(
  orderId: string,
  amount: number,
  provider: PaymentProvider,
  metadata?: Record<string, any>
): Promise<PaymentResult> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Generate mock transaction ID
    const transactionId = generateMockTransactionId(provider);

    // Create transaction with pending status
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        vendorId: order.vendorId,
        transactionId,
        paymentMethod: `${provider}_mobile_money`,
        paymentStatus: 'pending',
        amount,
        platformCommission: 0, // Will be calculated later
        vendorAmount: 0,
        isMock: true,
        metadata: metadata || {},
      },
    });

    // Link transaction to order
    await prisma.order.update({
      where: { id: orderId },
      data: { transactionId: transaction.id },
    });

    // Simulate processing delay
    const delayMs = parseInt(process.env.MOCK_PAYMENT_DELAY_MS || '3000', 10);
    await delay(delayMs);

    // Simulate success/failure (5% failure rate by default)
    const failureRate = parseFloat(process.env.MOCK_FAILURE_RATE || '0.05');
    const failed = Math.random() < failureRate;

    // Update transaction status
    const finalStatus: PaymentStatus = failed ? 'failed' : 'success';
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: finalStatus,
        completedAt: new Date(),
      },
    });

    return {
      transactionId,
      status: finalStatus,
      message: failed
        ? 'Payment failed due to insufficient funds'
        : 'Payment completed successfully',
    };
  } catch (error: any) {
    console.error('Mock payment flow error:', error);
    throw new Error(`Mock payment failed: ${error.message}`);
  }
}

/**
 * Initiate MTN Mobile Money payment
 * Live mode - calls actual MTN MoMo API
 */
export async function initiateMTNPayment(
  orderId: string,
  amount: number,
  phoneNumber: string
): Promise<PaymentResult> {
  const config = getMtnConfig();
  const msisdn = sanitizeMsisdn(phoneNumber);

  // Fetch order for vendor linkage
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      vendorId: true,
      orderNumber: true,
      customerName: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const referenceId = randomUUID();
  const accessToken = await getMtnAccessToken(config);

  await requestToPay(config, accessToken, {
    referenceId,
    amount,
    currency: config.currency,
    msisdn,
    externalId: order.orderNumber || order.id,
    payerMessage: `Payment for ${order.orderNumber || order.id}`,
    payeeNote: `DeliGo order ${order.orderNumber || order.id}`,
  });

  const transaction = await prisma.transaction.create({
    data: {
      orderId: order.id,
      vendorId: order.vendorId,
      transactionId: referenceId,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: 'pending',
      amount,
      platformCommission: 0,
      vendorAmount: 0,
      isMock: false,
      metadata: {
        phoneNumber: msisdn,
        provider: 'mtn',
        targetEnvironment: config.targetEnvironment,
      },
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { transactionId: transaction.id },
  });

  return {
    transactionId: referenceId,
    status: 'pending',
    message: 'Payment initiated. Please approve the request on your phone.',
  };
}

/**
 * Initiate Airtel Money payment
 * Live mode - calls actual Airtel Money API
 */
export async function initiateAirtelPayment(
  orderId: string,
  amount: number,
  phoneNumber: string
): Promise<PaymentResult> {
  // TODO: Replace with actual Airtel Money API integration
  // Documentation: https://developers.airtel.africa/
  // Endpoint: POST /merchant/v1/payments/

  /*
  Example implementation:

  // First, get access token
  const authResponse = await fetch(`${process.env.AIRTEL_API_URL}/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.AIRTEL_CLIENT_ID,
      client_secret: process.env.AIRTEL_API_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const { access_token } = await authResponse.json();

  // Then, initiate payment
  const paymentResponse = await fetch(`${process.env.AIRTEL_API_URL}/merchant/v1/payments/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'X-Country': 'RW',
      'X-Currency': 'RWF',
    },
    body: JSON.stringify({
      reference: orderId,
      subscriber: {
        country: 'RW',
        currency: 'RWF',
        msisdn: phoneNumber,
      },
      transaction: {
        amount: amount,
        country: 'RW',
        currency: 'RWF',
        id: orderId,
      },
    }),
  });

  const paymentData = await paymentResponse.json();
  const transactionId = paymentData.data.transaction.id;

  // Create transaction record
  await prisma.transaction.create({
    data: {
      orderId,
      transactionId,
      paymentMethod: 'airtel_mobile_money',
      paymentStatus: 'pending',
      amount,
      platformCommission: 0,
      vendorAmount: 0,
      isMock: false,
      metadata: { phoneNumber },
    },
  });

  return { transactionId, status: 'pending' };
  */

  throw new Error('Live Airtel payment not implemented. Set PAYMENTS_LIVE=false to use mock mode.');
}

/**
 * Check payment status (polling)
 * Used to check transaction status from provider
 */
export async function checkPaymentStatus(
  transactionId: string,
  provider: PaymentProvider
): Promise<PaymentStatus> {
  // Get transaction from database
  const transaction = await prisma.transaction.findUnique({
    where: { transactionId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // If mock transaction, return current status
  if (transaction.isMock) {
    return transaction.paymentStatus as PaymentStatus;
  }

  if (provider === 'mtn') {
    const config = getMtnConfig();
    const token = await getMtnAccessToken(config);
    const statusResponse = await fetchMtnTransactionStatus(config, token, transactionId);
    const mappedStatus = statusResponse.status;

    if (mappedStatus !== transaction.paymentStatus) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: mappedStatus,
          completedAt: mappedStatus === 'success' || mappedStatus === 'failed' ? new Date() : null,
          metadata: {
            ...(transaction.metadata as any),
            lastProviderStatus: statusResponse.rawStatus,
          },
        },
      });
    }

    return mappedStatus;
  }

  return transaction.paymentStatus as PaymentStatus;
}

/**
 * Process payment for an order
 * Main entry point that handles both mock and live modes
 */
export async function processPayment(
  orderId: string,
  amount: number,
  provider: PaymentProvider,
  phoneNumber?: string
): Promise<PaymentResult> {
  const isLive = process.env.PAYMENTS_LIVE === 'true';

  if (!isLive) {
    // Use mock flow for testing
    return await mockPaymentFlow(orderId, amount, provider, {
      phoneNumber,
      mode: 'mock',
    });
  }

  // Use live API
  if (provider === 'mtn') {
    if (!phoneNumber) throw new Error('Phone number required for MTN payment');
    return await initiateMTNPayment(orderId, amount, phoneNumber);
  } else if (provider === 'airtel') {
    if (!phoneNumber) throw new Error('Phone number required for Airtel payment');
    return await initiateAirtelPayment(orderId, amount, phoneNumber);
  }

  throw new Error(`Unsupported payment provider: ${provider}`);
}

/**
 * Handle payment webhook from provider
 * Called by MTN/Airtel when payment status changes
 */
export async function handlePaymentWebhook(
  payload: any,
  provider: PaymentProvider
): Promise<void> {
  // TODO: Implement webhook handling
  /*
  1. Verify webhook signature
  2. Extract transaction ID and status
  3. Update transaction in database
  4. Trigger commission calculation if status is success

  Example:
  const { transactionId, status } = payload;

  const transaction = await prisma.transaction.findUnique({
    where: { transactionId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Check for idempotency
  if (transaction.paymentStatus === status) {
    return; // Already processed
  }

  // Update status
  await prisma.transaction.update({
    where: { transactionId },
    data: {
      paymentStatus: status,
      completedAt: new Date(),
    },
  });

  // Trigger commission calculation if successful
  if (status === 'success') {
    await calculateCommission(transaction.orderId);
  }
  */

  console.log('Webhook received:', { provider, payload });
}
