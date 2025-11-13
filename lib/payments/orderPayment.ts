// Order Payment Orchestration Service
// Handles the complete flow from order creation to payment processing

import prisma from '@/lib/prisma';

export interface OrderPaymentData {
  vendorId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryNotes?: string;
  paymentMethod: 'cash_on_delivery' | 'mtn_mobile_money' | 'airtel_mobile_money';
  items: Array<{
    menuItemId: string;
    name: string;
    nameRw?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface OrderPaymentResult {
  success: boolean;
  order?: any;
  transaction?: any;
  error?: string;
  message?: string;
}

/**
 * Process order with payment - main orchestration function
 */
export async function processOrderWithPayment(
  orderData: OrderPaymentData
): Promise<OrderPaymentResult> {
  try {
    console.log('Starting order payment orchestration:', {
      vendorId: orderData.vendorId,
      paymentMethod: orderData.paymentMethod,
      total: orderData.total,
    });

    // Step 1: Validate order data
    const validation = await validateOrderData(orderData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Step 2: Create the order
    const order = await createOrder(orderData);
    console.log('Order created:', order.orderNumber);

    // Step 3: Process payment based on method
    let paymentResult;
    if (orderData.paymentMethod === 'cash_on_delivery') {
      // For COD, create escrow transaction directly
      const { createEscrowTransaction } = await import('./escrow');
      await createEscrowTransaction(order.id);
      paymentResult = {
        transactionId: `COD-${order.orderNumber}-${Date.now()}`,
        status: 'success',
        message: 'Cash on delivery order created',
      };
      console.log('COD escrow created for order:', order.orderNumber);
    } else {
      // For mobile money, process payment
      const { processPayment } = await import('./mobileMoney');
      const provider = orderData.paymentMethod === 'mtn_mobile_money' ? 'mtn' : 'airtel';
      paymentResult = await processPayment(
        order.id,
        orderData.total,
        provider,
        orderData.customerPhone
      );
      console.log('Payment processed:', paymentResult);
    }

    // Step 4: Update order with transaction details
    await updateOrderWithTransaction(order.id, paymentResult);

    // Step 5: Create admin log
    await createOrderPaymentLog(order.id, orderData, paymentResult);

    return {
      success: true,
      order,
      transaction: paymentResult,
      message: 'Order created and payment processed successfully',
    };

  } catch (error: any) {
    console.error('Order payment orchestration error:', error);

    // Create error log
    await createErrorLog(orderData, error);

    return {
      success: false,
      error: error.message || 'Failed to process order with payment',
    };
  }
}

/**
 * Validate order data before processing
 */
async function validateOrderData(orderData: OrderPaymentData): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if vendor exists and is active
    const vendor = await prisma.vendor.findUnique({
      where: { id: orderData.vendorId },
    });

    if (!vendor) {
      return { valid: false, error: 'Vendor not found' };
    }

    if (!vendor.isActive) {
      return { valid: false, error: 'Vendor is not active' };
    }

    // Validate payment method
    const validMethods = ['cash_on_delivery', 'mtn_mobile_money', 'airtel_mobile_money'];
    if (!validMethods.includes(orderData.paymentMethod)) {
      return { valid: false, error: 'Invalid payment method' };
    }

    // Check if vendor accepts the payment method
    if (!vendor.acceptedPaymentMethods.includes(orderData.paymentMethod)) {
      return { valid: false, error: `Vendor does not accept ${orderData.paymentMethod}` };
    }

    // Validate delivery requirements
    if (orderData.deliveryType === 'delivery' && !orderData.deliveryAddress) {
      return { valid: false, error: 'Delivery address is required for delivery orders' };
    }

    // Validate phone number for mobile money
    if (orderData.paymentMethod !== 'cash_on_delivery') {
      const cleanPhone = orderData.customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        return { valid: false, error: 'Valid phone number required for mobile money payments' };
      }
    }

    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      return { valid: false, error: 'Order must contain at least one item' };
    }

    // Check menu item availability
    const menuItemIds = orderData.items.map(item => item.menuItemId);
    const availableItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        vendorId: orderData.vendorId,
        isAvailable: true,
      },
    });

    if (availableItems.length !== orderData.items.length) {
      return { valid: false, error: 'Some items are not available' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
}

/**
 * Create order with unique order number
 */
async function createOrder(orderData: OrderPaymentData) {
  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      vendorId: orderData.vendorId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail || null,
      deliveryType: orderData.deliveryType,
      deliveryAddress: orderData.deliveryAddress || null,
      deliveryNotes: orderData.deliveryNotes || null,
      paymentMethod: orderData.paymentMethod,
      status: 'new',
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      items: {
        create: orderData.items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          nameRw: item.nameRw || null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          notes: null,
        })),
      },
    },
    include: {
      vendor: {
        select: {
          businessName: true,
          logoUrl: true,
        },
      },
      items: true,
    },
  });

  return order;
}

/**
 * Generate unique order number
 */
async function generateOrderNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DEL-${today}`;

  // Find the highest sequence number for today
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Update order with transaction details
 */
async function updateOrderWithTransaction(orderId: string, paymentResult: any) {
  // Find the transaction created by payment processing
  const { prisma: prismaImport } = await import('@/lib/prisma');
  const transaction = await prismaImport.transaction.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

  if (transaction) {
    await prismaImport.order.update({
      where: { id: orderId },
      data: { transactionId: transaction.id },
    });
  }
}

/**
 * Create admin log for order payment
 */
async function createOrderPaymentLog(orderId: string, orderData: OrderPaymentData, paymentResult: any) {
  try {
    const { prisma: prismaImport } = await import('@/lib/prisma');
    await prismaImport.adminLog.create({
      data: {
        action: 'order_payment_processed',
        targetType: 'order',
        targetId: orderId,
        details: {
          paymentMethod: orderData.paymentMethod,
          amount: orderData.total,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
        },
      },
    });
  } catch (error) {
    console.error('Failed to create order payment log:', error);
    // Silently fail if logging doesn't work
  }
}

/**
 * Create error log for failed order payments
 */
async function createErrorLog(orderData: OrderPaymentData, error: any) {
  try {
    const { prisma: prismaImport } = await import('@/lib/prisma');
    await prismaImport.adminLog.create({
      data: {
        action: 'order_payment_failed',
        targetType: 'system',
        targetId: 'order_payment',
        details: {
          error: error.message,
          stack: error.stack,
          paymentMethod: orderData.paymentMethod,
          amount: orderData.total,
          customerPhone: orderData.customerPhone,
        },
      },
    });
  } catch {
    // Silently fail if logging doesn't work
  }
}