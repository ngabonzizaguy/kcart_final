/**
 * Customer Migration Script
 * 
 * This script creates Customer records from existing Order data.
 * It groups orders by phone number and aggregates customer metrics.
 * 
 * Run with: npx ts-node scripts/migrateCustomers.ts
 * Or add to package.json: "migrate:customers": "ts-node scripts/migrateCustomers.ts"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OrderGroup {
  phone: string;
  orders: Array<{
    id: string;
    customerName: string;
    customerEmail: string | null;
    total: number;
    createdAt: Date;
    vendorId: string;
  }>;
}

async function migrateCustomers() {
  console.log('🚀 Starting customer migration...\n');

  try {
    // Step 1: Fetch all orders
    console.log('📦 Fetching all orders...');
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        total: true,
        createdAt: true,
        vendorId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`   Found ${orders.length} orders\n`);

    // Step 2: Group orders by phone number
    console.log('🔄 Grouping orders by phone number...');
    const ordersByPhone = new Map<string, OrderGroup>();

    orders.forEach((order) => {
      const phone = order.customerPhone;
      
      if (!ordersByPhone.has(phone)) {
        ordersByPhone.set(phone, {
          phone,
          orders: [],
        });
      }

      ordersByPhone.get(phone)!.orders.push({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        total: order.total,
        createdAt: order.createdAt,
        vendorId: order.vendorId,
      });
    });

    console.log(`   Found ${ordersByPhone.size} unique customers\n`);

    // Step 3: Create Customer records
    console.log('✨ Creating customer records...');
    let createdCount = 0;
    let updatedOrdersCount = 0;
    const conflicts: Array<{ phone: string; emails: string[] }> = [];

    for (const [phone, group] of ordersByPhone.entries()) {
      // Use most recent order for customer name and email
      const latestOrder = group.orders[group.orders.length - 1];
      
      // Check for email conflicts
      const uniqueEmails = new Set(
        group.orders
          .map((o) => o.customerEmail)
          .filter((email): email is string => email !== null)
      );

      if (uniqueEmails.size > 1) {
        conflicts.push({
          phone,
          emails: Array.from(uniqueEmails),
        });
      }

      // Calculate metrics
      const totalOrders = group.orders.length;
      const totalSpend = group.orders.reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue = totalSpend / totalOrders;
      const firstOrderAt = group.orders[0].createdAt;
      const lastOrderAt = group.orders[group.orders.length - 1].createdAt;

      // Find favorite vendor (most frequent)
      const vendorCounts = new Map<string, number>();
      group.orders.forEach((order) => {
        vendorCounts.set(
          order.vendorId,
          (vendorCounts.get(order.vendorId) || 0) + 1
        );
      });

      let favoriteVendorId = null;
      let maxCount = 0;
      vendorCounts.forEach((count, vendorId) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteVendorId = vendorId;
        }
      });

      // Create or update Customer record
      const customer = await prisma.customer.upsert({
        where: { phone },
        create: {
          phone,
          email: latestOrder.customerEmail,
          name: latestOrder.customerName,
          totalOrders,
          totalSpend,
          averageOrderValue,
          firstOrderAt,
          lastOrderAt,
          favoriteVendorId,
        },
        update: {
          email: latestOrder.customerEmail,
          name: latestOrder.customerName,
          totalOrders,
          totalSpend,
          averageOrderValue,
          lastOrderAt,
          favoriteVendorId,
        },
      });

      createdCount++;

      // Update all orders with customerId
      await prisma.order.updateMany({
        where: {
          customerPhone: phone,
        },
        data: {
          customerId: customer.id,
        },
      });

      updatedOrdersCount += group.orders.length;

      // Progress indicator
      if (createdCount % 50 === 0) {
        console.log(`   Processed ${createdCount} / ${ordersByPhone.size} customers...`);
      }
    }

    console.log(`   ✅ Created/updated ${createdCount} customer records`);
    console.log(`   ✅ Updated ${updatedOrdersCount} orders with customerId\n`);

    // Step 4: Report conflicts
    if (conflicts.length > 0) {
      console.log(`⚠️  Found ${conflicts.length} customers with multiple emails:`);
      conflicts.slice(0, 10).forEach((conflict) => {
        console.log(`   Phone: ${conflict.phone}`);
        console.log(`   Emails: ${conflict.emails.join(', ')}\n`);
      });
      if (conflicts.length > 10) {
        console.log(`   ... and ${conflicts.length - 10} more\n`);
      }
      console.log('   (Using most recent email for each customer)\n');
    }

    // Step 5: Summary statistics
    console.log('📊 Migration Summary:');
    const stats = await prisma.customer.aggregate({
      _count: { id: true },
      _sum: {
        totalOrders: true,
        totalSpend: true,
      },
      _avg: {
        averageOrderValue: true,
        totalOrders: true,
      },
    });

    console.log(`   Total Customers: ${stats._count.id}`);
    console.log(`   Total Orders: ${stats._sum.totalOrders || 0}`);
    console.log(`   Total Revenue: ${stats._sum.totalSpend?.toFixed(2) || 0} RWF`);
    console.log(`   Avg Order Value: ${stats._avg.averageOrderValue?.toFixed(2) || 0} RWF`);
    console.log(`   Avg Orders per Customer: ${stats._avg.totalOrders?.toFixed(1) || 0}\n`);

    // Step 6: Identify top customers
    console.log('🏆 Top 5 Customers by Spend:');
    const topCustomers = await prisma.customer.findMany({
      take: 5,
      orderBy: { totalSpend: 'desc' },
      select: {
        name: true,
        phone: true,
        totalOrders: true,
        totalSpend: true,
      },
    });

    topCustomers.forEach((customer, index) => {
      console.log(
        `   ${index + 1}. ${customer.name} (${customer.phone}) - ${customer.totalOrders} orders, ${customer.totalSpend.toFixed(2)} RWF`
      );
    });

    console.log('\n✅ Customer migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCustomers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });