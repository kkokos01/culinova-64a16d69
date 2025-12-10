// scripts/migrate-optimized.js
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

const BATCH_SIZE = 500; // Process 500 rows at a time

async function migrate() {
  console.log("🚀 Starting Optimized Data Migration (Prod → Dev)...\n");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both databases.");

    // Start transaction
    await dev.query('BEGIN;');
    console.log("🔒 Started transaction on dev database.");

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
        
        // Get all data from production
        const prodData = await prod.query(`SELECT * FROM "${tableName}" ORDER BY id`);
        const rows = prodData.rows;
        
        if (rows.length === 0) continue;
        
        // Get column names
        const columns = Object.keys(rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(", ");
        
        // Process in batches
        let insertedCount = 0;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          
          // Build batch insert query
          const valuePlaceholders = batch.map((_, rowIndex) => {
            const rowPlaceholders = columns.map((_, colIndex) => {
              const paramIndex = (rowIndex * columns.length) + colIndex + 1;
              return `$${paramIndex}`;
            });
            return `(${rowPlaceholders.join(", ")})`;
          }).join(", ");
          
          const insertQuery = `
            INSERT INTO "${tableName}" (${columnList})
            VALUES ${valuePlaceholders}
          `;
          
          // Flatten batch values for parameterized query
          const flatValues = batch.flatMap(row => columns.map(col => row[col]));
          
          await dev.query(insertQuery, flatValues);
          insertedCount += batch.length;
          
          if (insertedCount % 1000 === 0 || insertedCount === rowCount) {
            console.log(`   📈 Progress: ${insertedCount}/${rowCount} rows migrated`);
          }
        }
        
        console.log(`   ✅ Migrated ${insertedCount}/${rowCount} rows to dev.`);
        totalRowsMigrated += insertedCount;
        
      } catch (err) {
        console.error(`   ❌ Failed to migrate ${tableName}: ${err.message}`);
        throw err; // This will trigger transaction rollback
      }
    }

    // Re-enable foreign key constraints
    await dev.query("SET session_replication_role = 'origin';");
    
    // Update sequences
    console.log("\n🔧 Updating ID sequences...");
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        await dev.query(`SELECT setval('"${tableName}_id_seq"', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1));`);
        console.log(`   ✅ Updated sequence for ${tableName}`);
      } catch (err) {
        // Some tables might not have sequences, that's fine
        console.log(`   ℹ️  No sequence to update for ${tableName}`);
      }
    }
    
    // Commit transaction
    await dev.query('COMMIT;');
    console.log("✅ Transaction committed successfully.");
    
    console.log(`\n🎉 Migration Complete! Total rows migrated: ${totalRowsMigrated}`);

  } catch (err) {
    console.error("\n❌ Critical Error:", err);
    console.log("🔄 Rolling back transaction...");
    try {
      await dev.query('ROLLBACK;');
      console.log("✅ Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("❌ Rollback failed:", rollbackErr);
    }
  } finally {
    await prod.end();
    await dev.end();
  }
}

migrate();
