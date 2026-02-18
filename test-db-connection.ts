#!/usr/bin/env tsx

/**
 * Test Database Connection
 * Tests connection to Supabase and verifies basic functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database\n');

    // Test 2: Query users table
    console.log('Test 2: Querying users table...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database\n`);

    // Test 3: List all users
    console.log('Test 3: Listing all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });
    
    console.log('Users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || user.email}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Active: ${user.active ? '✅' : '❌'}`);
      console.log('');
    });

    // Test 4: Check stores
    console.log('Test 4: Checking stores...');
    const storeCount = await prisma.store.count();
    console.log(`✅ Found ${storeCount} stores in database\n`);

    // Test 5: Check audits
    console.log('Test 5: Checking audits...');
    const auditCount = await prisma.audit.count();
    console.log(`✅ Found ${auditCount} audits in database\n`);

    console.log('=' .repeat(50));
    console.log('✅ All database tests passed!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
