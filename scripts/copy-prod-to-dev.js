import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Production and Dev configurations
const prodConfig = {
  url: 'https://zujlsbkxxsmiiwgyodph.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
};

const devConfig = {
  url: 'https://aajeyifqrupykjyapoft.supabase.co', 
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
};

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
  'shopping_list_items': 'shopping_items',  // prod shopping_list_items -> dev shopping_items
  'user_spaces': 'space_members'  // prod user_spaces -> dev space_members
};

async function copyAllData() {
  const prodClient = createClient(prodConfig.url, prodConfig.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const devClient = createClient(devConfig.url, devConfig.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  console.log('Starting data copy from production to dev...');

  // Copy in dependency order to maintain foreign key constraints
  const copyOrder = ['spaces', 'user_profiles', 'user_spaces', 'space_invitations', 'recipes', 'recipe_versions', 'ingredients', 'shopping_list_items', 'pantry_items'];

  for (const prodTableName of copyOrder) {
    if (!tableMappings[prodTableName]) {
      console.log(`Skipping ${prodTableName} (no mapping)`);
      continue;
    }

    const devTableName = tableMappings[prodTableName];
    
    try {
      console.log(`Copying ${prodTableName} -> ${devTableName}...`);
      
      // Get all data from production
      const { data: prodData, error: prodError } = await prodClient
        .from(prodTableName)
        .select('*');
      
      if (prodError) {
        console.error(`Error fetching ${prodTableName}:`, prodError);
        continue;
      }
      
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
      
      if (prodTableName === 'shopping_list_items' && devTableName === 'shopping_items') {
        // Skip this table for now - dev expects shopping_list_id but prod doesn't have it
        console.log(`Skipping ${prodTableName} (schema incompatibility - dev needs shopping_list_id)`);
        continue;
      }
      
      // Clear dev table first
      const { error: deleteError } = await devClient
        .from(devTableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.error(`Error clearing dev ${devTableName}:`, deleteError);
        continue;
      }
      
      // Insert data into dev
      if (transformedData.length > 0) {
        const { error: insertError } = await devClient
          .from(devTableName)
          .insert(transformedData);
        
        if (insertError) {
          console.error(`Error inserting into dev ${devTableName}:`, insertError);
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
