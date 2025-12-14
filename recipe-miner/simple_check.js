import { createClient } from '@supabase/supabase-js'

// Environment configurations
const environments = {
  dev: {
    url: 'https://aajeyifqrupykjyapoft.supabase.co',
    key: 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
  },
  prod: {
    url: 'https://zujlsbkxxsmiiwgyodph.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
  }
}

async function checkEnvironment(env, name) {
  console.log(`\n=== Checking ${name.toUpperCase()} ===`)
  const client = createClient(environments[env].url, environments[env].key)
  
  try {
    // 1. Try to select approval columns directly
    const { data, error } = await client
      .from('recipes')
      .select('id, qa_status, approved_by, approved_at, is_public, privacy_level')
      .limit(1)
    
    if (error) {
      console.log('❌ Error selecting approval columns:', error.message)
      
      // 2. Check if basic recipes table works
      const { data: basic, error: basicError } = await client
        .from('recipes')
        .select('id, title, created_at')
        .limit(1)
      
      if (basicError) {
        console.log('❌ Cannot access recipes table at all')
      } else {
        console.log('✅ Recipes table exists but missing approval columns')
      }
    } else {
      console.log('✅ Approval columns exist')
      console.log('Sample:', data[0])
      
      // 3. Count recipes by status
      const { data: counts } = await client
        .from('recipes')
        .select('qa_status')
        .then(({ data }) => {
          const counts = {}
          data?.forEach(r => {
            counts[r.qa_status] = (counts[r.qa_status] || 0) + 1
          })
          return counts
        })
      
      console.log('Recipe counts by status:', counts)
    }
    
    // 4. Check for views
    const { data: views, error: viewError } = await client
      .from('pending_approval_recipes')
      .select('id')
      .limit(1)
    
    if (viewError) {
      console.log('❌ pending_approval_recipes view missing')
    } else {
      console.log('✅ pending_approval_recipes view exists')
    }
    
    // 5. Check migration table
    const { data: migrations } = await client
      .from('schema_migrations')
      .select('version, name')
      .ilike('name', '%approval%')
    
    console.log('Approval migrations:', migrations || 'None')
    
  } catch (e) {
    console.error('Unexpected error:', e.message)
  }
}

async function main() {
  await checkEnvironment('dev', 'DEV')
  await checkEnvironment('prod', 'PRODUCTION')
  
  console.log('\n=== RECOMMENDATIONS ===')
  console.log('1. If PROD is missing approval columns, run the migration in production')
  console.log('2. If DEV is missing approval columns, run: supabase db push')
  console.log('3. After migration, test the approval workflow in production')
}

main()
