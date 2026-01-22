// Complete script to add coins - creates user if needed and adds coins
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(process.cwd(), 'server', 'data');
const SHARE_RECORDS_DB_FILE = join(DATA_DIR, 'share-records-database.json');
const USERS_DB_FILE = join(DATA_DIR, 'users-database.json');

async function addCoinsComplete() {
  const targetEmail = 'mdh897046@gmail.com';
  const coinsToAdd = 10000;
  const targetName = 'Test User'; // Default name

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
        console.log('📝 Users database file not found. Creating new database...');
        users = [];
      } else {
        throw e;
      }
    }

    // Find or create user
    let user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    
    if (!user) {
      console.log(`⚠️ User not found. Creating new user account...`);
      
      // Generate user ID and referral code
      const userId = Date.now().toString();
      const referralCode = `REF${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      
      user = {
        id: userId,
        email: targetEmail,
        name: targetName,
        accountType: 'user',
        role: 'user',
        status: 'active',
        emailVerified: false,
        downloads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referralCode: referralCode,
      };
      
      users.push(user);
      
      // Save users database
      await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
      console.log(`✅ Created user: ${targetEmail} (ID: ${user.id})`);
    } else {
      console.log(`✅ Found existing user: ${user.name || user.email} (ID: ${user.id})`);
    }

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
    console.log(`👤 User ID: ${user.id}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. If using MongoDB, restart the server to sync these changes`);
    console.log(`   2. The user can now check their earnings at /earnings`);
    console.log(`   3. They can test the withdraw system with these coins`);
    console.log(`\n📋 To verify:`);
    console.log(`   - User email: ${targetEmail}`);
    console.log(`   - Coins added: ${coinsToAdd}`);
    console.log(`   - Status: approved (will appear immediately)\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  }
}

addCoinsComplete();

