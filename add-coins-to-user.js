// Script to add coins to a user - works with file database
// For MongoDB, use the API endpoint after restarting the server

import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(process.cwd(), 'server', 'data');
const SHARE_RECORDS_DB_FILE = join(DATA_DIR, 'share-records-database.json');
const USERS_DB_FILE = join(DATA_DIR, 'users-database.json');

async function addCoins() {
  const targetEmail = 'mdh897046@gmail.com';
  const coinsToAdd = 10000;

  console.log(`\n💰 Adding ${coinsToAdd} coins to ${targetEmail}...\n`);

  try {
    // Load users
    let users = [];
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const usersData = await fs.readFile(USERS_DB_FILE, 'utf-8');
      users = JSON.parse(usersData);
      console.log(`✅ Loaded ${users.length} users from database`);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log('⚠️ Users database file not found. Creating empty database...');
        users = [];
      } else {
        throw e;
      }
    }

    // Find user by email
    const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    
    if (!user) {
      console.error(`\n❌ User not found with email: ${targetEmail}`);
      console.log('\n📋 Available users:');
      if (users.length === 0) {
        console.log('   (No users found in database)');
      } else {
        users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
      }
      console.log('\n💡 Instructions:');
      console.log(`   1. Make sure the user "${targetEmail}" has logged in at least once`);
      console.log(`   2. This creates their account in the database`);
      console.log(`   3. Then run this script again to add the coins`);
      console.log('\n   OR use the API endpoint after restarting the server:');
      console.log(`   POST http://localhost:8080/api/admin/add-coins`);
      console.log(`   Body: { "email": "${targetEmail}", "coins": ${coinsToAdd} }`);
      return;
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Load share records
    let shareRecords = [];
    try {
      const data = await fs.readFile(SHARE_RECORDS_DB_FILE, 'utf-8');
      shareRecords = JSON.parse(data);
      console.log(`✅ Loaded ${shareRecords.length} share records`);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log('📝 Creating new share records database...');
        shareRecords = [];
      } else {
        throw e;
      }
    }

    // Create share record
    const shareRecord = {
      id: `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: user.id,
      shareType: 'admin_post',
      shareLink: 'admin-grant',
      coinsEarned: coinsToAdd,
      registrationCount: 0,
      createdAt: new Date().toISOString(),
      status: 'approved',
      adminNote: `Admin grant of ${coinsToAdd} coins for withdraw system testing`,
    };

    shareRecords.push(shareRecord);
    
    // Save back to file
    await fs.writeFile(SHARE_RECORDS_DB_FILE, JSON.stringify(shareRecords, null, 2), 'utf-8');
    
    console.log(`\n✅ Successfully added ${coinsToAdd} coins to ${targetEmail}!`);
    console.log(`📝 Share Record ID: ${shareRecord.id}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. If using MongoDB, restart the server to sync changes`);
    console.log(`   2. The user can now check their earnings at /earnings`);
    console.log(`   3. They can test the withdraw system with these coins\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  }
}

addCoins();

