// scripts/migrate-simple.js
import pg from 'pg';
const { Client } = pg;

const PROD_DB_URL = "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres";
const DEV_DB_URL =  "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

// Tables to migrate (in dependency order)
const TABLES_TO_MIGRATE = [
  'spaces',
  'user_profiles', 
  'user_spaces',
  'space_invitations',
  'recipes',
  'recipe_versions',
  'ingredients',
  'pantry_items',
  'shopping_list_items'
];

async function migrate() {
  console.log("🚀 Starting Simple Data Migration (Prod → Dev)...\n");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both databases.");

    // Disable foreign key constraints temporarily
    await dev.query("SET session_replication_role = 'replica';");

    let totalRowsMigrated = 0;

    for (const tableName of TABLES_TO_MIGRATE) {
      console.log(`\n📦 Migrating ${tableName}...`);
      
      try {
        // Get row count from production
        const countResult = await prod.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = parseInt(countResult.rows[0].count);
        
        if (rowCount === 0) {
          console.log(`   ℹ️  No data in ${tableName}. Skipping.`);
          continue;
        }
        
        console.log(`   📊 Found ${rowCount} rows in production.`);
        
        // Clear dev table
        await dev.query(`DELETE FROM "${tableName}";`);
        console.log(`   🧹 Cleared dev table.`);
        
        // Copy data using INSERT INTO ... SELECT FROM
        const copyQuery = `
          INSERT INTO "${tableName}" 
          SELECT * FROM dblink('${PROD_DB_URL}', 'SELECT * FROM "${tableName}"') 
          AS t(${await getColumnDefinition(prod, tableName)});
        `;
        
        // Alternative approach: Read from prod, insert into dev
        const prodData = await prod.query(`SELECT * FROM "${tableName}"`);
        
        let insertedCount = 0;
        for (const row of prodData.rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          
          const insertQuery = `
            INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")})
            VALUES (${placeholders})
          `;
          
          await dev.query(insertQuery, values);
          insertedCount++;
        }
        
        console.log(`   ✅ Migrated ${insertedCount}/${rowCount} rows to dev.`);
        totalRowsMigrated += insertedCount;
        
      } catch (err) {
        console.error(`   ❌ Failed to migrate ${tableName}: ${err.message}`);
      }
    }

    // Re-enable foreign key constraints
    await dev.query("SET session_replication_role = 'origin';");
    
    // Update sequences
    console.log("\n🔧 Updating ID sequences...");
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        await dev.query(`SELECT setval('"${tableName}_id_seq"', (SELECT MAX(id) FROM "${tableName}"));`);
        console.log(`   ✅ Updated sequence for ${tableName}`);
      } catch (err) {
        // Some tables might not have sequences, that's fine
        console.log(`   ℹ️  No sequence to update for ${tableName}`);
      }
    }
    
    console.log(`\n🎉 Migration Complete! Total rows migrated: ${totalRowsMigrated}`);

  } catch (err) {
    console.error("\n❌ Critical Error:", err);
  } finally {
    await prod.end();
    await dev.end();
  }
}

async function getColumnDefinition(client, tableName) {
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = '${tableName}' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  return result.rows.map(col => `${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`).join(', ');
}

migrate();
