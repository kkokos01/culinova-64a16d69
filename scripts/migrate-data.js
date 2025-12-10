// scripts/migrate-data.js
import pg from 'pg';
const { Client } = pg;

// --- CONFIGURATION ---
// PASTE YOUR FULL CONNECTION STRINGS HERE
const PROD_DB_URL = "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres";
const DEV_DB_URL =  "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres";

// Define Schema Mappings (Prod Table -> Dev Table)
// If columns match, keep mapping empty. If columns changed, map 'old_col': 'new_col'
const MAPPINGS = [
  {
    from: 'user_profiles', // Prod Table Name
    to: 'profiles',        // Dev Table Name
    columns: {
      'user_id': 'id',      // Map user_profiles.user_id -> profiles.id
      'display_name': 'username', // Map display_name -> username
      'display_name': 'full_name' // Also map to full_name
    }
  },
  {
    from: 'user_spaces',
    to: 'space_members',
    columns: {
      'created_at': 'joined_at' // Map created_at -> joined_at
    }
  },
  {
    from: 'space_invitations',
    to: 'invitations',
    columns: {
      'inviter_id': 'invited_by',    // Map inviter_id -> invited_by
      'email_address': 'invited_email' // Map email_address -> invited_email
    }
  },
  {
    from: 'spaces',
    to: 'spaces',
    columns: {} 
  },
  {
    from: 'recipes',
    to: 'recipes',
    columns: {} 
  },
  {
    from: 'recipe_versions',
    to: 'recipe_versions',
    columns: {} 
  },
  {
    from: 'ingredients',
    to: 'ingredients',
    columns: {} 
  },
  {
    from: 'pantry_items',
    to: 'pantry_items',
    columns: {} 
  }
  // Add other tables here as needed
];

async function migrate() {
  console.log("🚀 Starting Direct DB Migration...");

  const prod = new Client({ connectionString: PROD_DB_URL, ssl: { rejectUnauthorized: false } });
  const dev = new Client({ connectionString: DEV_DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await prod.connect();
    await dev.connect();
    console.log("✅ Connected to both databases.");

    // 1. Disable Constraints on Dev (Allows inserting out of order)
    await dev.query("SET session_replication_role = 'replica';");

    for (const map of MAPPINGS) {
      console.log(`\n📦 Migrating ${map.from} -> ${map.to}...`);
      
      // Read from Prod
      const res = await prod.query(`SELECT * FROM "${map.from}"`);
      const rows = res.rows;
      
      if (rows.length === 0) {
        console.log(`   - No data in ${map.from}. Skipping.`);
        continue;
      }

      console.log(`   - Found ${rows.length} rows.`);

      // Write to Dev (Batch Insert)
      let successCount = 0;
      for (const row of rows) {
        // Map columns if needed
        const newRow = {};
        Object.keys(row).forEach(key => {
          const newKey = map.columns[key] || key;
          newRow[newKey] = row[key];
        });

        // Construct Insert
        const keys = Object.keys(newRow).map(k => `"${k}"`).join(", ");
        const values = Object.values(newRow);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        const queryText = `
          INSERT INTO "${map.to}" (${keys}) 
          VALUES (${placeholders})
          ON CONFLICT (id) DO NOTHING; -- Skip if exists
        `;

        try {
          await dev.query(queryText, values);
          successCount++;
        } catch (err) {
          console.error(`   ❌ Failed to insert row ${row.id}: ${err.message}`);
        }
      }
      console.log(`   ✅ Migrated ${successCount}/${rows.length} rows.`);
    }

    // 2. Re-enable Constraints
    await dev.query("SET session_replication_role = 'origin';");
    
    // 3. Fix Sequences (So new IDs don't conflict)
    console.log("\n🔧 Fixing ID sequences...");
    for (const map of MAPPINGS) {
      try {
        await dev.query(`SELECT setval('"${map.to}_id_seq"', (SELECT MAX(id) FROM "${map.to}"));`);
        console.log(`   ✅ Fixed sequence for ${map.to}`);
      } catch (err) {
        console.log(`   ⚠️  Could not fix sequence for ${map.to}: ${err.message}`);
      }
    }

    console.log("\n🎉 Migration Complete!");

  } catch (err) {
    console.error("\n❌ Critical Error:", err);
  } finally {
    await prod.end();
    await dev.end();
  }
}

migrate();
