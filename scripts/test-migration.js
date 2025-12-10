// scripts/test-migration.js
import pg from 'pg';
const { Client } = pg;

const PROD_DB_URL = "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres";
const DEV_DB_URL =  "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

async function testMigration() {
  console.log("🧪 Testing Migration Logic on user_profiles table (5 rows)...\n");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both databases.");

    const tableName = 'user_profiles';
    
    // Check production data
    const prodCount = await prod.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    console.log(`📊 Production ${tableName}: ${prodCount.rows[0].count} rows`);
    
    // Show sample data
    const prodSample = await prod.query(`SELECT * FROM "${tableName}" LIMIT 2`);
    console.log("📋 Sample production data:");
    prodSample.rows.forEach(row => {
      console.log(`   ${JSON.stringify(row, null, 2)}`);
    });

    // Start transaction
    await dev.query('BEGIN;');
    await dev.query("SET session_replication_role = 'replica';");

    // Clear dev table
    await dev.query(`DELETE FROM "${tableName}";`);
    console.log(`🧹 Cleared dev ${tableName} table.`);

    // Get production data
    const prodData = await prod.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    const rows = prodData.rows;
    
    if (rows.length === 0) {
      console.log("❌ No data found in production table");
      return;
    }

    // Get columns and test batch insert
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(", ");
    
    console.log(`📝 Columns: ${columnList}`);
    
    // Test batch insert with all rows
    const BATCH_SIZE = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
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
      
      const flatValues = batch.flatMap(row => columns.map(col => row[col]));
      
      console.log(`🔧 Executing batch insert with ${batch.length} rows...`);
      console.log(`📝 Query: ${insertQuery.substring(0, 100)}...`);
      
      await dev.query(insertQuery, flatValues);
      insertedCount += batch.length;
    }

    // Verify results
    const devCount = await dev.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const devRows = await dev.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    
    console.log(`✅ Inserted: ${insertedCount} rows`);
    console.log(`✅ Dev count: ${devCount.rows[0].count} rows`);
    
    // Compare data
    console.log("📋 Dev data after migration:");
    devRows.rows.forEach(row => {
      console.log(`   ${JSON.stringify(row, null, 2)}`);
    });

    // Update sequence
    await dev.query(`SELECT setval('"${tableName}_id_seq"', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1));`);
    
    await dev.query("SET session_replication_role = 'origin';");
    await dev.query('COMMIT;');
    
    console.log("✅ Test migration completed successfully!");
    console.log("🎉 Batch insert logic works - ready for full migration");

  } catch (err) {
    console.error("❌ Test failed:", err);
    await dev.query('ROLLBACK;');
    console.log("🔄 Rolled back test transaction");
  } finally {
    await prod.end();
    await dev.end();
  }
}

testMigration();
