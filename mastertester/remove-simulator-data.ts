import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function removeSimulatorData() {
  const prisma = new PrismaClient();

  try {
    console.log('🧹 Starting data removal...\n');
    console.log('⚠️  WARNING: This will delete ALL tickets and ALL agents from the database!\n');

    // Step 1: Delete ALL Tickets
    console.log('🗑️  Deleting all tickets...');
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`   ✓ Deleted ${deletedTickets.count} tickets`);

    // Step 2: Delete ALL Agent-Category Assignments
    console.log('🔗 Removing all agent-category assignments...');
    const deletedAssignments = await prisma.agentCategory.deleteMany({});
    console.log(`   ✓ Deleted ${deletedAssignments.count} agent-category assignments`);

    // Step 3: Delete ALL Agents (users with role 'agent')
    console.log('👤 Deleting all agents...');
    const deletedAgents = await prisma.user.deleteMany({
      where: { role: 'agent' },
    });
    console.log(`   ✓ Deleted ${deletedAgents.count} agents`);

    // Step 4: Delete metadata file if it exists
    const metadataPath = path.join(__dirname, 'simulator-metadata.json');
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
      console.log('\n   ✓ Removed metadata file');
    }

    console.log('\n✅ Data removal completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Tickets deleted: ${deletedTickets.count}`);
    console.log(`   - Agent-Category assignments deleted: ${deletedAssignments.count}`);
    console.log(`   - Agents deleted: ${deletedAgents.count}`);

  } catch (error) {
    console.error('❌ Error removing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}


// Main execution
async function main() {
  const confirm = process.argv.includes('--confirm');

  if (!confirm) {
    console.log('⚠️  WARNING: This will delete ALL tickets and ALL agents from the database!');
    console.log('   This is a destructive operation that cannot be undone.');
    console.log('   Run with --confirm flag to proceed.\n');
    console.log('   Example: npm run remove-simulator-data -- --confirm');
    process.exit(0);
  }

  await removeSimulatorData();
}

main()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

