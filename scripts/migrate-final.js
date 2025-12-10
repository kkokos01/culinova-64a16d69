// scripts/migrate-final.js
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

const BATCH_SIZE = 500; // Supabase recommended batch size

async function migrate() {
  console.log("🚀 Starting Supabase Data Migration (Production → Development)...\n");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both Supabase databases using direct PostgreSQL connections.");

    // Start transaction for atomic migration
    await dev.query('BEGIN;');
    console.log("🔒 Started transaction on dev database.");

    // Disable foreign key constraints (Supabase best practice)
    await dev.query("SET session_replication_role = 'replica';");
    console.log("🔓 Disabled foreign key constraints temporarily.");

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
        
        // Clear dev table (clean slate)
        await dev.query(`DELETE FROM "${tableName}";`);
        console.log(`   🧹 Cleared dev table.`);
        
        // Get all data from production (ordered for consistency)
        const prodData = await prod.query(`SELECT * FROM "${tableName}" ORDER BY id`);
        const rows = prodData.rows;
        
        if (rows.length === 0) continue;
        
        // Get column names dynamically
        const columns = Object.keys(rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(", ");
        
        // Process in batches (Supabase performance optimization)
        let insertedCount = 0;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          
          // Build batch insert query with parameterized values
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
          
          // Flatten batch values for parameterized query (handles NULL correctly)
          const flatValues = batch.flatMap(row => columns.map(col => row[col]));
          
          await dev.query(insertQuery, flatValues);
          insertedCount += batch.length;
          
          // Progress reporting
          if (insertedCount % 1000 === 0 || insertedCount === rowCount) {
            console.log(`   📈 Progress: ${insertedCount}/${rowCount} rows migrated`);
          }
        }
        
        console.log(`   ✅ Migrated ${insertedCount}/${rowCount} rows to dev.`);
        totalRowsMigrated += insertedCount;
        
      } catch (err) {
        console.error(`   ❌ Failed to migrate ${tableName}: ${err.message}`);
        throw err; // Triggers transaction rollback
      }
    }

    // Re-enable foreign key constraints
    await dev.query("SET session_replication_role = 'origin';");
    console.log("🔒 Re-enabled foreign key constraints.");
    
    // Update sequences (Supabase requirement for new inserts)
    console.log("\n🔧 Updating ID sequences...");
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        await dev.query(`SELECT setval('"${tableName}_id_seq"', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1));`);
        console.log(`   ✅ Updated sequence for ${tableName}`);
      } catch (err) {
        console.log(`   ℹ️  No sequence to update for ${tableName}`);
      }
    }
    
    // Commit transaction
    await dev.query('COMMIT;');
    console.log("✅ Transaction committed successfully.");
    
    console.log(`\n🎉 Migration Complete! Total rows migrated: ${totalRowsMigrated}`);

  } catch (err) {
    console.error("\n❌ Migration Error:", err);
    console.log("🔄 Rolling back transaction to maintain data integrity...");
    try {
      await dev.query('ROLLBACK;');
      console.log("✅ Transaction rolled back. Dev database is unchanged.");
    } catch (rollbackErr) {
      console.error("❌ Rollback failed:", rollbackErr);
    }
  } finally {
    await prod.end();
    await dev.end();
    console.log("🔌 Database connections closed.");
  }
}

migrate();
