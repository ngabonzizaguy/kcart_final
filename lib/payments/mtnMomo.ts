// MTN Mobile Money (MoMo) Integration for Rwanda
// Follows official MTN MoMo API workflow for collections

import crypto from 'crypto';

// Configuration interfaces
interface MomoConfig {
  subscriptionKey: string;
  apiUserId: string;
  apiKey: string;
  baseUrl: string;
  targetEnvironment: string;
  callbackUrl?: string;
}

// Transaction interfaces
interface MomoPaymentRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface MomoPaymentResponse {
  transactionId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  message?: string;
}

/**
 * Get MTN MoMo configuration based on environment
 */
function getMomoConfig(): MomoConfig {
  const environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
  const isProduction = environment === 'production';

  const config: MomoConfig = {
    subscriptionKey: isProduction
      ? process.env.MTN_MOMO_SUBSCRIPTION_KEY_PRODUCTION!
      : process.env.MTN_MOMO_SUBSCRIPTION_KEY_SANDBOX!,
    apiUserId: isProduction
      ? process.env.MTN_MOMO_API_USER_ID_PRODUCTION!
      : process.env.MTN_MOMO_API_USER_ID_SANDBOX!,
    apiKey: isProduction
      ? process.env.MTN_MOMO_API_KEY_PRODUCTION!
      : process.env.MTN_MOMO_API_KEY_SANDBOX!,
    baseUrl: isProduction
      ? process.env.MTN_MOMO_BASE_URL_PRODUCTION!
      : process.env.MTN_MOMO_BASE_URL_SANDBOX!,
    targetEnvironment: isProduction
      ? process.env.MTN_MOMO_TARGET_ENV || 'mtnrwanda'
      : 'sandbox',
    callbackUrl: process.env.MTN_MOMO_CALLBACK_URL,
  };

  // Validate required configuration
  const requiredFields = ['subscriptionKey', 'apiUserId', 'apiKey', 'baseUrl', 'targetEnvironment'];
  for (const field of requiredFields) {
    if (!config[field as keyof MomoConfig]) {
      throw new Error(`Missing required MTN MoMo configuration: ${field} for ${environment} environment`);
    }
  }

  return config;
}

/**
 * Generate Base64 encoded API Key for authentication
 */
function generateBase64ApiKey(apiUserId: string, apiKey: string): string {
  const credentials = `${apiUserId}:${apiKey}`;
  return Buffer.from(credentials).toString('base64');
}

/**
 * Generate UUID for transaction reference
 */
function generateTransactionId(): string {
  return crypto.randomUUID();
}

/**
 * Make HTTP request to MTN MoMo API
 */
async function makeMomoRequest(
  url: string,
  method: 'GET' | 'POST',
  body?: any,
  headers: Record<string, string> = {}
): Promise<any> {
  const config = getMomoConfig();

  const defaultHeaders = {
    'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    'Content-Type': 'application/json',
    ...headers,
  };

  const requestOptions: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MTN MoMo API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return response.text();
  } catch (error) {
    console.error('MTN MoMo API request failed:', error);
    throw error;
  }
}

/**
 * Get OAuth2 access token from MTN MoMo API
 */
export async function getMomoAccessToken(): Promise<string> {
  const config = getMomoConfig();
  const tokenUrl = `${config.baseUrl}/collection/token/`;

  const base64Credentials = generateBase64ApiKey(config.apiUserId, config.apiKey);

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token received from MTN MoMo API');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting MTN MoMo access token:', error);
    throw new Error(`Failed to authenticate with MTN MoMo: ${error}`);
  }
}

/**
 * Initiate payment request (RequestToPay)
 */
export async function initiateMomoPayment(
  amount: number,
  phoneNumber: string,
  orderId: string,
  customerName?: string
): Promise<MomoPaymentResponse> {
  const config = getMomoConfig();
  const transactionId = generateTransactionId();

  // Validate phone number format for Rwanda
  if (!phoneNumber.startsWith('250')) {
    throw new Error('Phone number must include Rwanda country code (250...)');
  }

  // Format payment request
  const paymentRequest: MomoPaymentRequest = {
    amount: amount.toString(),
    currency: 'RWF', // Rwandan Franc
    externalId: orderId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: phoneNumber,
    },
    payerMessage: `DeliGo Order Payment ${orderId}`,
    payeeNote: `Payment for order ${orderId}${customerName ? ` by ${customerName}` : ''}`,
  };

  try {
    // Get access token
    const accessToken = await getMomoAccessToken();

    // Make payment request
    const requestToPayUrl = `${config.baseUrl}/collection/v1_0/requesttopay`;

    await makeMomoRequest(requestToPayUrl, 'POST', paymentRequest, {
      'Authorization': `Bearer ${accessToken}`,
      'X-Reference-Id': transactionId,
      'X-Target-Environment': config.targetEnvironment,
      'X-Callback-Url': config.callbackUrl,
    });

    console.log('MTN MoMo payment request initiated:', {
      transactionId,
      amount,
      phoneNumber,
      orderId,
      environment: process.env.MTN_MOMO_ENVIRONMENT,
    });

    return {
      transactionId,
      status: 'PENDING',
      message: 'Payment request sent. Please check your phone to confirm.',
    };
  } catch (error) {
    console.error('Error initiating MTN MoMo payment:', error);
    throw new Error(`Failed to initiate payment: ${error}`);
  }
}

/**
 * Check payment status
 */
export async function checkMomoPaymentStatus(transactionId: string): Promise<MomoPaymentResponse> {
  const config = getMomoConfig();

  try {
    const accessToken = await getMomoAccessToken();

    const statusUrl = `${config.baseUrl}/collection/v1_0/requesttopay/${transactionId}`;

    const response = await makeMomoRequest(statusUrl, 'GET', undefined, {
      'Authorization': `Bearer ${accessToken}`,
      'X-Target-Environment': config.targetEnvironment,
    });

    let status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';

    switch (response.status) {
      case 'PENDING':
        status = 'PENDING';
        break;
      case 'SUCCESSFUL':
        status = 'SUCCESSFUL';
        break;
      case 'FAILED':
      case 'TIMEDOUT':
        status = 'FAILED';
        break;
      default:
        status = 'PENDING';
    }

    return {
      transactionId,
      status,
      message: response.reason || `Payment status: ${response.status}`,
    };
  } catch (error) {
    console.error('Error checking MTN MoMo payment status:', error);
    throw new Error(`Failed to check payment status: ${error}`);
  }
}

/**
 * Handle MTN MoMo webhook callback
 */
export async function handleMomoWebhook(payload: any): Promise<MomoPaymentResponse> {
  try {
    console.log('MTN MoMo webhook received:', payload);

    const { transactionId, status } = payload;

    if (!transactionId || !status) {
      throw new Error('Invalid webhook payload: missing transactionId or status');
    }

    let mappedStatus: 'PENDING' | 'SUCCESSFUL' | 'FAILED';

    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
        mappedStatus = 'SUCCESSFUL';
        break;
      case 'FAILED':
      case 'TIMEOUT':
        mappedStatus = 'FAILED';
        break;
      case 'PENDING':
      default:
        mappedStatus = 'PENDING';
    }

    return {
      transactionId,
      status: mappedStatus,
      message: `Payment ${mappedStatus.toLowerCase()} via webhook`,
    };
  } catch (error) {
    console.error('Error processing MTN MoMo webhook:', error);
    throw new Error(`Webhook processing failed: ${error}`);
  }
}

/**
 * Validate Rwanda phone number for MTN MoMo
 */
export function validateMomoPhoneNumber(phoneNumber: string): boolean {
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  if (cleanPhone.length !== 12) {
    return false;
  }

  if (!cleanPhone.startsWith('250')) {
    return false;
  }

  const subscriberNumber = cleanPhone.slice(3);
  return subscriberNumber.startsWith('78') || subscriberNumber.startsWith('79');
}

/**
 * Format phone number for MTN MoMo API
 */
export function formatMomoPhoneNumber(phoneNumber: string): string {
  let cleanPhone = phoneNumber.replace(/\D/g, '');

  if (cleanPhone.length === 12 && cleanPhone.startsWith('250')) {
    return cleanPhone;
  }

  if (cleanPhone.length === 9) {
    return `250${cleanPhone}`;
  }

  if (cleanPhone.length > 12 && cleanPhone.startsWith('250')) {
    return cleanPhone.slice(0, 12);
  }

  throw new Error('Invalid phone number format for MTN MoMo');
}

/**
 * Get environment info for debugging
 */
export function getMomoEnvironmentInfo() {
  const environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
  const config = getMomoConfig();

  return {
    environment,
    baseUrl: config.baseUrl,
    targetEnvironment: config.targetEnvironment,
    hasSubscriptionKey: !!config.subscriptionKey,
    hasApiUserId: !!config.apiUserId,
    hasApiKey: !!config.apiKey,
    hasCallbackUrl: !!config.callbackUrl,
  };
}