// scripts/check-dev-data.js
import pg from 'pg';
const { Client } = pg;

const DEV_DB_URL = "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

async function checkDevData() {
  console.log("🔍 Checking for data in dev tables before deletion...\n");

  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await dev.connect();
    console.log("✅ Connected to dev database.");

    // Tables we plan to delete
    const tablesToCheck = ['invitations', 'profiles', 'shopping_items', 'shopping_lists', 'space_members'];

    for (const tableName of tablesToCheck) {
      try {
        console.log(`📋 Checking ${tableName}...`);
        const result = await dev.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`⚠️  ${tableName}: ${count} rows found - DO NOT DELETE!`);
          
          // Show sample data
          const sample = await dev.query(`SELECT * FROM "${tableName}" LIMIT 3`);
          console.log("   Sample data:");
          sample.rows.forEach(row => {
            console.log(`   - ${JSON.stringify(row, null, 2)}`);
          });
        } else {
          console.log(`✅ ${tableName}: ${count} rows - Safe to delete`);
        }
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`ℹ️  ${tableName}: Table does not exist`);
        } else {
          console.error(`❌ Error checking ${tableName}: ${err.message}`);
        }
      }
    }

    console.log("\n📊 Summary:");
    console.log("Only proceed with deletion if all tables show 0 rows or 'Table does not exist'");

  } catch (err) {
    console.error("❌ Critical Error:", err);
  } finally {
    await dev.end();
  }
}

checkDevData();
