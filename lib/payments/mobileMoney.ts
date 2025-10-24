// Mobile Money Payment Integration (MTN & Airtel)
// Supports mock mode for testing and live mode for production

import prisma from '@/lib/prisma';

export type PaymentProvider = 'mtn' | 'airtel';
export type PaymentStatus = 'pending' | 'success' | 'failed';

interface PaymentResult {
  transactionId: string;
  status: PaymentStatus;
  message?: string;
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
  // TODO: Replace with actual MTN MoMo API integration
  // Documentation: https://momodeveloper.mtn.com/
  // Endpoint: POST /collection/v1_0/requesttopay

  /*
  Example implementation:

  const response = await fetch(`${process.env.MTN_API_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MTN_API_KEY}`,
      'X-Reference-Id': uuidv4(),
      'X-Target-Environment': 'sandbox', // or 'production'
      'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'RWF',
      externalId: orderId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: 'DeliGo Order Payment',
      payeeNote: `Payment for order ${orderId}`,
    }),
  });

  const transactionId = response.headers.get('X-Reference-Id');

  // Create transaction record
  await prisma.transaction.create({
    data: {
      orderId,
      transactionId: transactionId!,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: 'pending',
      amount,
      platformCommission: 0,
      vendorAmount: 0,
      isMock: false,
      metadata: { phoneNumber },
    },
  });

  return { transactionId: transactionId!, status: 'pending' };
  */

  throw new Error('Live MTN payment not implemented. Set PAYMENTS_LIVE=false to use mock mode.');
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

  // TODO: Poll actual payment provider API for status
  /*
  For MTN:
  const response = await fetch(
    `${process.env.MTN_API_URL}/collection/v1_0/requesttopay/${transactionId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MTN_API_KEY}`,
        'X-Target-Environment': 'production',
        'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!,
      },
    }
  );
  const data = await response.json();
  return data.status === 'SUCCESSFUL' ? 'success' : 'failed';
  */

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