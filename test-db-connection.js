const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  console.log('🔌 Attempting to connect to database...');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/password=[^;]+/, 'password=****'));

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 AS test`;
    console.log('✅ Query test successful:', result);
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
