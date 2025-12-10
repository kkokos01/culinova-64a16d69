// scripts/migrate-data-fixed.js
import pg from 'pg';
const { Client } = pg;

// --- CONFIGURATION ---
const PROD_DB_URL = "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres";
const DEV_DB_URL =  "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

async function migrate() {
  console.log("🚀 Starting Direct DB Migration (Fixed)...");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both databases.");

    // Disable constraints on Dev
    await dev.query("SET session_replication_role = 'replica';");

    // 1. Migrate spaces first (no transformations needed)
    console.log("\n📦 Migrating spaces...");
    const spacesRes = await prod.query(`SELECT * FROM spaces`);
    if (spacesRes.rows.length > 0) {
      console.log(`   - Found ${spacesRes.rows.length} rows.`);
      for (const row of spacesRes.rows) {
        const keys = Object.keys(row).map(k => `"${k}"`).join(", ");
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        await dev.query(`INSERT INTO spaces (${keys}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`, values);
      }
      console.log(`   ✅ Migrated spaces.`);
    }

    // 2. Migrate user_profiles -> profiles (with transformation)
    console.log("\n📦 Migrating user_profiles -> profiles...");
    const profilesRes = await prod.query(`SELECT * FROM user_profiles`);
    if (profilesRes.rows.length > 0) {
      console.log(`   - Found ${profilesRes.rows.length} rows.`);
      for (const row of profilesRes.rows) {
        const transformedRow = {
          id: row.user_id,
          username: row.display_name,
          full_name: row.display_name,
          avatar_url: row.avatar_url,
          updated_at: row.updated_at
        };
        
        const keys = Object.keys(transformedRow).map(k => `"${k}"`).join(", ");
        const values = Object.values(transformedRow);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        await dev.query(`INSERT INTO profiles (${keys}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`, values);
      }
      console.log(`   ✅ Migrated profiles.`);
    }

    // 3. Migrate user_spaces -> space_members (with transformation)
    console.log("\n📦 Migrating user_spaces -> space_members...");
    const membersRes = await prod.query(`SELECT * FROM user_spaces`);
    if (membersRes.rows.length > 0) {
      console.log(`   - Found ${membersRes.rows.length} rows.`);
      for (const row of membersRes.rows) {
        const transformedRow = {
          id: row.id,
          space_id: row.space_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.created_at
        };
        
        const keys = Object.keys(transformedRow).map(k => `"${k}"`).join(", ");
        const values = Object.values(transformedRow);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        await dev.query(`INSERT INTO space_members (${keys}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`, values);
      }
      console.log(`   ✅ Migrated space_members.`);
    }

    // 4. Migrate space_invitations -> invitations (with transformation)
    console.log("\n📦 Migrating space_invitations -> invitations...");
    const invitationsRes = await prod.query(`SELECT * FROM space_invitations`);
    if (invitationsRes.rows.length > 0) {
      console.log(`   - Found ${invitationsRes.rows.length} rows.`);
      for (const row of invitationsRes.rows) {
        const transformedRow = {
          id: row.id,
          space_id: row.space_id,
          invited_by: row.inviter_id,
          invited_email: row.email_address,
          token: 'generated-' + row.id,
          status: row.status,
          created_at: row.created_at,
          expires_at: row.expires_at
        };
        
        const keys = Object.keys(transformedRow).map(k => `"${k}"`).join(", ");
        const values = Object.values(transformedRow);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        await dev.query(`INSERT INTO invitations (${keys}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`, values);
      }
      console.log(`   ✅ Migrated invitations.`);
    }

    // 5. Migrate remaining tables (no transformations)
    const simpleTables = ['recipes', 'recipe_versions', 'ingredients', 'pantry_items'];
    for (const tableName of simpleTables) {
      console.log(`\n📦 Migrating ${tableName}...`);
      const res = await prod.query(`SELECT * FROM ${tableName}`);
      if (res.rows.length > 0) {
        console.log(`   - Found ${res.rows.length} rows.`);
        for (const row of res.rows) {
          const keys = Object.keys(row).map(k => `"${k}"`).join(", ");
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          
          await dev.query(`INSERT INTO "${tableName}" (${keys}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING;`, values);
        }
        console.log(`   ✅ Migrated ${tableName}.`);
      }
    }

    // Re-enable constraints
    await dev.query("SET session_replication_role = 'origin';");
    
    console.log("\n🎉 Migration Complete!");

  } catch (err) {
    console.error("\n❌ Critical Error:", err);
  } finally {
    await prod.end();
    await dev.end();
  }
}

migrate();
