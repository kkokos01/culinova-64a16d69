import { createClient } from '@supabase/supabase-js';

const devConfig = {
  url: 'https://aajeyifqrupykjyapoft.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzI2NCwiZXhwIjoyMDgwODA5MjY0fQ.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
};

async function checkDevSchema() {
  const client = createClient(devConfig.url, devConfig.serviceKey);
  
  console.log('Checking dev database schema...');
  
  // Get all tables in public schema
  const { data: tables, error } = await client
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');
  
  if (error) {
    console.error('Error fetching tables:', error);
    return;
  }
  
  console.log('Tables in dev database:');
  tables.forEach(table => {
    console.log(`- ${table.table_name}`);
  });
  
  // Check specific tables we expect
  const expectedTables = [
    'profiles', 'spaces', 'space_members', 'recipes', 
    'recipe_versions', 'ingredients', 'shopping_lists', 
    'shopping_items', 'pantry_items', 'invitations'
  ];
  
  console.log('\nMissing tables:');
  expectedTables.forEach(tableName => {
    const exists = tables.some(t => t.table_name === tableName);
    if (!exists) {
      console.log(`❌ ${tableName}`);
    } else {
      console.log(`✅ ${tableName}`);
    }
  });
}

checkDevSchema().catch(console.error);
