// scripts/check-schema.js
import pg from 'pg';
const { Client } = pg;

const PROD_DB_URL = "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres";
const DEV_DB_URL =  "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

async function checkSchema() {
  console.log("🔍 Comparing Production vs Dev Schema...\n");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();

    // Get all tables in both databases
    const prodTables = await prod.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const devTables = await dev.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    const prodTableNames = prodTables.rows.map(r => r.tablename);
    const devTableNames = devTables.rows.map(r => r.tablename);

    console.log("📊 PRODUCTION TABLES:");
    prodTableNames.forEach(name => console.log(`  - ${name}`));
    
    console.log("\n📊 DEV TABLES:");
    devTableNames.forEach(name => console.log(`  - ${name}`));

    console.log("\n🔍 SCHEMA DIFFERENCES:");
    
    // Tables in prod but not in dev
    const missingInDev = prodTableNames.filter(name => !devTableNames.includes(name));
    if (missingInDev.length > 0) {
      console.log("❌ Tables in PRODUCTION but missing in DEV:");
      missingInDev.forEach(name => console.log(`  - ${name}`));
    }

    // Tables in dev but not in prod
    const extraInDev = devTableNames.filter(name => !prodTableNames.includes(name));
    if (extraInDev.length > 0) {
      console.log("⚠️  Tables in DEV but not in PRODUCTION:");
      extraInDev.forEach(name => console.log(`  - ${name}`));
    }

    // Common tables to compare column structure
    const commonTables = prodTableNames.filter(name => devTableNames.includes(name));
    
    console.log("\n🔍 COLUMN DIFFERENCES (for key tables):");
    const keyTables = ['spaces', 'user_profiles', 'user_spaces', 'space_invitations', 'recipes'];
    
    for (const tableName of keyTables) {
      if (commonTables.includes(tableName)) {
        console.log(`\n📋 ${tableName}:`);
        
        const prodColumns = await prod.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        
        const devColumns = await dev.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);

        const prodCols = prodColumns.rows.map(r => `${r.column_name} (${r.data_type})`);
        const devCols = devColumns.rows.map(r => `${r.column_name} (${r.data_type})`);

        console.log(`  Production: ${prodCols.join(', ')}`);
        console.log(`  Dev:        ${devCols.join(', ')}`);

        const diff = prodCols.filter(col => !devCols.includes(col));
        if (diff.length > 0) {
          console.log(`  ❌ Missing in dev: ${diff.join(', ')}`);
        }
      }
    }

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prod.end();
    await dev.end();
  }
}

checkSchema();
