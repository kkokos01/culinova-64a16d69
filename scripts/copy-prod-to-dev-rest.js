import { createClient } from '@supabase/supabase-js';

// Production and Dev configurations
const prodConfig = {
  url: 'https://zujlsbkxxsmiiwgyodph.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
};

const devConfig = {
  url: 'https://aajeyifqrupykjyapoft.supabase.co', 
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
};

// Helper function to make REST API calls
async function restApiCall(baseUrl, serviceKey, table, method = 'GET', data = null) {
  const url = `${baseUrl}/rest/v1/${table}`;
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (method === 'GET') {
    return await response.json();
  } else {
    return await response.json();
  }
}

// Tables to copy (mapping production -> dev table names)
const tableMappings = {
  // Direct matches
  'spaces': 'spaces',
  'recipes': 'recipes', 
  'recipe_versions': 'recipe_versions',
  'ingredients': 'ingredients',
  'pantry_items': 'pantry_items',
  
  // Schema differences - map production tables to dev equivalents
  'user_profiles': 'profiles',  // prod user_profiles -> dev profiles
  'space_invitations': 'invitations',  // prod space_invitations -> dev invitations
  'user_spaces': 'space_members'  // prod user_spaces -> dev space_members
};

async function copyAllData() {
  console.log('Starting data copy from production to dev using REST API...');

  // Copy in dependency order to maintain foreign key constraints
  const copyOrder = ['spaces', 'user_profiles', 'user_spaces', 'space_invitations', 'recipes', 'recipe_versions', 'ingredients', 'pantry_items'];

  for (const prodTableName of copyOrder) {
    if (!tableMappings[prodTableName]) {
      console.log(`Skipping ${prodTableName} (no mapping)`);
      continue;
    }

    const devTableName = tableMappings[prodTableName];
    
    try {
      console.log(`Copying ${prodTableName} -> ${devTableName}...`);
      
      // Get all data from production using REST API
      const prodData = await restApiCall(prodConfig.url, prodConfig.serviceKey, prodTableName, 'GET');
      console.log(`Found ${prodData.length} rows in ${prodTableName}`);
      
      // Transform data for schema differences
      let transformedData = prodData;
      
      if (prodTableName === 'user_profiles' && devTableName === 'profiles') {
        // Map user_profiles.user_id -> profiles.id
        transformedData = prodData.map(row => ({
          id: row.user_id,
          username: row.display_name,
          full_name: row.display_name,
          avatar_url: row.avatar_url,
          updated_at: row.updated_at
        }));
      }
      
      if (prodTableName === 'user_spaces' && devTableName === 'space_members') {
        // Map user_spaces -> space_members
        transformedData = prodData.map(row => ({
          id: row.id,
          space_id: row.space_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.created_at
        }));
      }
      
      if (prodTableName === 'space_invitations' && devTableName === 'invitations') {
        // Map space_invitations -> invitations
        transformedData = prodData.map(row => ({
          id: row.id,
          space_id: row.space_id,
          invited_by: row.inviter_id,
          invited_email: row.email_address,
          token: 'generated-' + row.id, // Generate placeholder token
          status: row.status,
          created_at: row.created_at,
          expires_at: row.expires_at
        }));
      }
      
      // Clear dev table first using REST API
      const deleteUrl = `${devConfig.url}/rest/v1/${devTableName}?id=neq.00000000-0000-0000-0000-000000000000`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': devConfig.serviceKey,
          'Authorization': `Bearer ${devConfig.serviceKey}`
        }
      });
      
      if (!deleteResponse.ok) {
        console.error(`Error clearing dev ${devTableName}:`, await deleteResponse.text());
        continue;
      }
      
      // Insert data into dev using REST API
      if (transformedData.length > 0) {
        const insertResponse = await fetch(`${devConfig.url}/rest/v1/${devTableName}`, {
          method: 'POST',
          headers: {
            'apikey': devConfig.serviceKey,
            'Authorization': `Bearer ${devConfig.serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(transformedData)
        });
        
        if (!insertResponse.ok) {
          console.error(`Error inserting into dev ${devTableName}:`, await insertResponse.text());
          continue;
        }
      }
      
      console.log(`✅ Successfully copied ${prodTableName} -> ${devTableName}`);
      
    } catch (error) {
      console.error(`Failed to copy ${prodTableName}:`, error);
    }
  }
  
  console.log('Data copy complete!');
}

copyAllData().catch(console.error);
