// scripts/test-connection.js
import pg from 'pg';
const { Client } = pg;

// Test different connection string formats
const CONNECTIONS = [
  {
    name: "Production Direct DB",
    url: "postgresql://postgres:f847kJh7UNmdBT70@db.zujlsbkxxsmiiwgyodph.supabase.co:5432/postgres"
  },
  {
    name: "Production Pooler (Session)",
    url: "postgresql://postgres.fujlsbkxxsmiiwgyodph:f847kJh7UNmdBT70@aws-0-us-west-1.pooler.supabase.co:5432/postgres"
  },
  {
    name: "Production Pooler (Transaction)",
    url: "postgresql://postgres.fujlsbkxxsmiiwgyodph:f847kJh7UNmdBT70@aws-0-us-west-1.pooler.supabase.co:6543/postgres"
  },
  {
    name: "Dev Direct DB",
    url: "postgresql://postgres:vBLFrFRLPe2%218JCa@db.aajeyifqrupykjyapoft.supabase.co:5432/postgres"
  },
  {
    name: "Dev Pooler (Session)",
    url: "postgresql://postgres.aajeyifqrupykjyapoft:vBLFrFRLPe2%218JCa@aws-0-us-west-1.pooler.supabase.co:5432/postgres"
  },
  {
    name: "Dev Pooler (Transaction)",
    url: "postgresql://postgres.aajeyifqrupykjyapoft:vBLFrFRLPe2%218JCa@aws-0-us-west-1.pooler.supabase.co:6543/postgres"
  }
];

async function testConnections() {
  console.log("🔍 Testing different connection formats...\n");

  for (const conn of CONNECTIONS) {
    console.log(`Testing: ${conn.name}`);
    const client = new Client({ 
      connectionString: conn.url, 
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      const result = await client.query('SELECT 1 as test');
      console.log(`✅ SUCCESS: ${conn.name}`);
      console.log(`   Result: ${result.rows[0].test}`);
      await client.end();
    } catch (err) {
      console.log(`❌ FAILED: ${conn.name}`);
      console.log(`   Error: ${err.message}`);
      try {
        await client.end();
      } catch (e) {
        // Client might not be connected
      }
    }
    console.log('');
  }
}

testConnections();
