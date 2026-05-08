import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Encryption service (simplified version for script)
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly key: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
      console.warn('ENCRYPTION_KEY not set. Using default key (NOT SECURE FOR PRODUCTION).');
      this.key = crypto.scryptSync('default-key-change-in-production', 'salt', this.keyLength);
    } else {
      this.key = crypto.scryptSync(envKey, 'qms-salt', this.keyLength);
    }
  }

  encrypt(text: string): string {
    if (!text) return text;

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

      return Buffer.from(combined, 'utf8').toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }
}

// Sample data generators
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Nicole'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'
];

const serviceNames = [
  'Customer Service', 'Technical Support', 'Billing Inquiry', 'Account Management',
  'Product Information', 'Complaint Resolution', 'Order Processing', 'Returns & Refunds',
  'General Inquiry', 'VIP Services'
];

const customerNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yara', 'Zoe', 'Adam', 'Bella', 'Chris', 'Daisy', 'Ethan', 'Fiona',
  'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Mark', 'Nina'
];

const customerLastNames = [
  'Anderson', 'Baker', 'Carter', 'Dixon', 'Evans', 'Foster', 'Green', 'Harris',
  'Irwin', 'Johnson', 'Keller', 'Lewis', 'Mitchell', 'Nelson', 'Owens', 'Parker',
  'Quinn', 'Roberts', 'Stewart', 'Turner', 'Underwood', 'Vance', 'Watson', 'Young',
  'Adams', 'Brown', 'Clark', 'Davis', 'Edwards', 'Fisher', 'Gray', 'Hill'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomTimeInDay(date: Date, startHour: number = 9, endHour: number = 17): Date {
  const newDate = new Date(date);
  const hour = getRandomInt(startHour, endHour);
  const minute = getRandomInt(0, 59);
  newDate.setHours(hour, minute, 0, 0);
  return newDate;
}

function generatePhoneNumber(): string {
  return `+1${getRandomInt(200, 999)}${getRandomInt(200, 999)}${getRandomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
}

async function createSimulatorData() {
  const prisma = new PrismaClient();
  const encryptionService = new EncryptionService();

  try {
    console.log('🚀 Starting simulator data creation...\n');

    // Track created IDs for cleanup
    const createdData = {
      agentIds: [] as string[],
      categoryIds: [] as string[],
      ticketIds: [] as string[],
      agentCategoryIds: [] as string[],
    };

    // Step 1: Create 20 Agents
    console.log('📝 Creating 20 agents...');
    const hashedPassword = await bcrypt.hash('agent123', 10);

    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const email = `agent${i + 1}@qms-simulator.com`;
      const username = `agent${i + 1}`;
      const phone = generatePhoneNumber();
      const employeeId = `QMS-AGT-${String(i + 1).padStart(3, '0')}`;
      const counterNumber = i < 10 ? `C${i + 1}` : null;

      const agent = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName: encryptionService.encrypt(firstName),
          lastName: encryptionService.encrypt(lastName),
          phone: encryptionService.encrypt(phone),
          role: 'agent',
          isActive: true,
          employeeId,
          counterNumber,
          language: 'en',
          theme: 'light',
        },
      });

      createdData.agentIds.push(agent.id);
      console.log(`  ✓ Created agent: ${firstName} ${lastName} (${employeeId})`);
    }

    // Step 2: Create 10 Services/Categories
    console.log('\n📋 Creating 10 services/categories...');
    const descriptions = [
      'Handle general customer inquiries and support',
      'Provide technical assistance and troubleshooting',
      'Process billing questions and payment issues',
      'Manage customer accounts and profiles',
      'Answer questions about products and services',
      'Resolve customer complaints and issues',
      'Process new orders and order modifications',
      'Handle returns, refunds, and exchanges',
      'General information and assistance',
      'Premium services for VIP customers'
    ];

    for (let i = 0; i < 10; i++) {
      const category = await prisma.category.create({
        data: {
          name: serviceNames[i],
          description: descriptions[i],
          isActive: true,
          estimatedWaitTime: getRandomInt(5, 30), // 5-30 minutes
        },
      });

      createdData.categoryIds.push(category.id);
      console.log(`  ✓ Created category: ${serviceNames[i]}`);
    }

    // Step 3: Assign Agents to Services (Realistic distribution)
    console.log('\n🔗 Assigning agents to services...');
    // Each agent handles 1-3 categories
    // Each category has 2-5 agents

    for (const categoryId of createdData.categoryIds) {
      const numAgents = getRandomInt(2, 5);
      const shuffledAgents = [...createdData.agentIds].sort(() => Math.random() - 0.5);
      const selectedAgents = shuffledAgents.slice(0, numAgents);

      for (const agentId of selectedAgents) {
        const agentCategory = await prisma.agentCategory.create({
          data: {
            agentId,
            categoryId,
            isActive: true,
            assignedAt: new Date(),
          },
        });
        createdData.agentCategoryIds.push(agentCategory.id);
      }
    }

    // Count assignments per agent
    const agentAssignments = new Map<string, number>();
    for (const ac of await prisma.agentCategory.findMany({
      where: { agentId: { in: createdData.agentIds } },
    })) {
      agentAssignments.set(ac.agentId, (agentAssignments.get(ac.agentId) || 0) + 1);
    }

    console.log(`  ✓ Assigned agents to services (${createdData.agentCategoryIds.length} assignments)`);
    console.log(`    - Agents handle 1-${Math.max(...Array.from(agentAssignments.values()))} categories each`);

    // Step 4: Create Tickets
    const today = new Date();

    // Status distribution: 40% completed, 20% pending, 15% serving, 10% called, 15% hold
    const statusWeights = [
      { status: 'completed', weight: 40 },
      { status: 'pending', weight: 20 },
      { status: 'serving', weight: 15 },
      { status: 'called', weight: 10 },
      { status: 'hold', weight: 15 },
    ];

    // Track token numbers per category per day
    const tokenCounters = new Map<string, Map<string, number>>();

    // Helper function to generate unique token number
    async function generateUniqueTokenNumber(category: any, ticketDate: Date): Promise<string> {
      const categoryCode = category.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const ticketDateStr = ticketDate.toISOString().split('T')[0];

      // Initialize counters if needed
      if (!tokenCounters.has(categoryCode)) {
        tokenCounters.set(categoryCode, new Map());
      }
      const dayCounters = tokenCounters.get(categoryCode)!;

      // Get the last ticket for this category on this day from database
      const dayStart = new Date(ticketDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(ticketDate);
      dayEnd.setHours(23, 59, 59, 999);

      const lastTicket = await prisma.ticket.findFirst({
        where: {
          tokenNumber: { startsWith: `${categoryCode}-` },
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let counter = 1;
      if (lastTicket) {
        // Extract number from existing token
        const parts = lastTicket.tokenNumber.split('-');
        if (parts.length > 1) {
          const lastNum = parseInt(parts[parts.length - 1] || '0');
          counter = lastNum + 1;
        }
      }

      // Check if we have a counter for this day in memory (for same-day tickets)
      if (dayCounters.has(ticketDateStr)) {
        const memCounter = dayCounters.get(ticketDateStr)!;
        counter = Math.max(counter, memCounter + 1);
      }

      // Ensure uniqueness by checking database
      let tokenNumber = `${categoryCode}-${String(counter).padStart(3, '0')}`;
      let attempts = 0;
      while (attempts < 100) {
        const existing = await prisma.ticket.findUnique({
          where: { tokenNumber },
        });
        if (!existing) {
          dayCounters.set(ticketDateStr, counter);
          return tokenNumber;
        }
        counter++;
        tokenNumber = `${categoryCode}-${String(counter).padStart(3, '0')}`;
        attempts++;
      }

      throw new Error(`Failed to generate unique token number for ${category.name} on ${ticketDateStr}`);
    }

    // Helper function to create tickets
    async function createTickets(
      count: number,
      startDate: Date,
      endDate: Date,
      description: string
    ): Promise<number> {
      console.log(`\n🎫 Creating ${count} tickets ${description}...`);
      let createdCount = 0;

      for (let i = 0; i < count; i++) {
        // Random date within the specified range
        const ticketDate = getRandomDate(startDate, endDate);
        const ticketDateStr = ticketDate.toISOString().split('T')[0];

        // Select random category
        const categoryId = getRandomElement(createdData.categoryIds);
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) continue;

        // Get agents for this category
        const agentCategories = await prisma.agentCategory.findMany({
          where: { categoryId, isActive: true },
        });
        if (agentCategories.length === 0) continue;

        const agentCategory = getRandomElement(agentCategories);
        const agentId = agentCategory.agentId;

        // Generate unique token number
        const tokenNumber = await generateUniqueTokenNumber(category, ticketDate);

        // Select status based on weights
        const random = Math.random() * 100;
        let cumulative = 0;
        let selectedStatus = 'pending';
        for (const sw of statusWeights) {
          cumulative += sw.weight;
          if (random <= cumulative) {
            selectedStatus = sw.status;
            break;
          }
        }

        // Generate customer data
        const customerFirstName = getRandomElement(customerNames);
        const customerLastName = getRandomElement(customerLastNames);
        const customerName = `${customerFirstName} ${customerLastName}`;
        const customerPhone = generatePhoneNumber();
        const customerEmail = generateEmail(customerFirstName, customerLastName);

        // Create realistic timestamps based on status
        const createdAt = getRandomTimeInDay(ticketDate, 9, 17);
        let calledAt: Date | null = null;
        let servingStartedAt: Date | null = null;
        let completedAt: Date | null = null;
        let noShowAt: Date | null = null;
        let positionInQueue = 0;

        if (selectedStatus === 'pending') {
          positionInQueue = getRandomInt(1, 10);
        } else if (selectedStatus === 'called') {
          positionInQueue = 1;
          calledAt = new Date(createdAt.getTime() + getRandomInt(5, 30) * 60000); // 5-30 min after creation
        } else if (selectedStatus === 'serving') {
          positionInQueue = 0;
          calledAt = new Date(createdAt.getTime() + getRandomInt(5, 30) * 60000);
          servingStartedAt = new Date(calledAt.getTime() + getRandomInt(1, 5) * 60000); // 1-5 min after called
        } else if (selectedStatus === 'completed') {
          positionInQueue = 0;
          calledAt = new Date(createdAt.getTime() + getRandomInt(5, 30) * 60000);
          servingStartedAt = new Date(calledAt.getTime() + getRandomInt(1, 5) * 60000);
          completedAt = new Date(servingStartedAt.getTime() + getRandomInt(5, 45) * 60000); // 5-45 min service time
        } else if (selectedStatus === 'hold') {
          positionInQueue = 0;
          calledAt = new Date(createdAt.getTime() + getRandomInt(5, 30) * 60000);
          noShowAt = new Date(calledAt.getTime() + getRandomInt(10, 20) * 60000);
        }

        // Generate form data (optional)
        const formData = Math.random() > 0.5 ? encryptionService.encryptObject({
          priority: getRandomElement(['low', 'medium', 'high']),
          source: getRandomElement(['walk-in', 'phone', 'online', 'appointment']),
          notes: `Customer inquiry about ${category.name.toLowerCase()}`,
        }) : null;

        // Generate note for completed/hold tickets
        let note: string | null = null;
        if (selectedStatus === 'completed' && Math.random() > 0.3) {
          note = `Successfully resolved customer inquiry. Service time: ${Math.round((completedAt!.getTime() - servingStartedAt!.getTime()) / 60000)} minutes.`;
        } else if (selectedStatus === 'hold' && Math.random() > 0.5) {
          note = 'Customer did not respond to call. Marked as hold.';
        }

        try {
          const ticket = await prisma.ticket.create({
            data: {
              tokenNumber,
              categoryId,
              agentId,
              status: selectedStatus,
              customerName: encryptionService.encrypt(customerName),
              customerPhone: encryptionService.encrypt(customerPhone),
              customerEmail: encryptionService.encrypt(customerEmail),
              formData,
              note,
              calledAt,
              servingStartedAt,
              completedAt,
              noShowAt,
              positionInQueue,
              createdAt,
              updatedAt: completedAt || noShowAt || servingStartedAt || calledAt || createdAt,
            } as any,
          });

          createdData.ticketIds.push(ticket.id);
          createdCount++;

          const progressInterval = count >= 500 ? 50 : 10;
          if ((i + 1) % progressInterval === 0) {
            console.log(`  ✓ Created ${i + 1}/${count} tickets...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create ticket ${i + 1}: ${error.message}`);
          // Continue with next ticket
        }
      }

      console.log(`  ✓ Created ${createdCount}/${count} tickets ${description}`);
      return createdCount;
    }

    // Create 500 tickets for this week (last 7 days)
    const weekStartDate = new Date(today);
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    await createTickets(500, weekStartDate, today, 'for this week (last 7 days)');

    // Create 500 tickets for random dates (less than current date)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // End of yesterday
    const randomStartDate = new Date(today);
    randomStartDate.setDate(randomStartDate.getDate() - 90);
    await createTickets(500, randomStartDate, yesterday, 'across random dates (less than current date)');

    // Step 5: Save metadata for cleanup
    const metadata = {
      createdData,
      createdAt: new Date().toISOString(),
      description: 'Simulator data created by mastertester script',
    };

    await prisma.$executeRaw`
      IF OBJECT_ID('tempdb..##simulator_metadata', 'U') IS NOT NULL
        DROP TABLE ##simulator_metadata;
    `.catch(() => { });

    // Store metadata in a way we can retrieve it
    // We'll use a JSON file instead since SQL Server temp tables might not persist
    const metadataPath = path.join(__dirname, 'simulator-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('\n✅ Simulator data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Agents: ${createdData.agentIds.length}`);
    console.log(`   - Categories: ${createdData.categoryIds.length}`);
    console.log(`   - Agent-Category Assignments: ${createdData.agentCategoryIds.length}`);
    console.log(`   - Tickets: ${createdData.ticketIds.length} total`);
    console.log(`     • 500 tickets for this week (last 7 days)`);
    console.log(`     • 500 tickets across random dates (less than current date)`);
    console.log(`   - Date Range: ${randomStartDate.toLocaleDateString()} to ${yesterday.toLocaleDateString()}`);
    console.log('\n💾 Metadata saved to simulator-metadata.json for cleanup');

  } catch (error) {
    console.error('❌ Error creating simulator data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSimulatorData()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

