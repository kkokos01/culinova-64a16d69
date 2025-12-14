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

async function queryEnvironment(env, name) {
  console.log(`\n=== Querying ${name.toUpperCase()} Environment ===`)
  const client = createClient(environments[env].url, environments[env].key)
  
  const results = {}
  
  try {
    // 1. Check recipes table structure
    const { data: recipesColumns } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'recipes')
      .order('ordinal_position')
    
    results.recipesColumns = recipesColumns
    
    // 2. Check for approval workflow columns
    const approvalColumns = recipesColumns?.filter(c => 
      ['qa_status', 'approved_by', 'approved_at'].includes(c.column_name)
    )
    results.approvalColumns = approvalColumns
    
    // 3. Check constraints on recipes
    const { data: constraints } = await client
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .ilike('constraint_name', '%qa_status%')
    
    results.qaStatusConstraint = constraints
    
    // 4. Check views
    const { data: views } = await client
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', '%approval%')
    
    results.approvalViews = views
    
    // 5. Check RLS policies on recipes
    let policies = []
    try {
      const result = await client.rpc('get_policies_for_table', { table_name: 'recipes' })
      policies = result.data || []
    } catch (e) {
      policies = []
    }
    
    results.recipesPolicies = policies
    
    // 6. Check migration history
    const { data: migrations } = await client
      .from('schema_migrations')
      .select('version, name')
      .ilike('name', '%approval%')
    
    results.approvalMigrations = migrations
    
    // 7. Check sample data
    const { data: sampleRecipes } = await client
      .from('recipes')
      .select('qa_status, is_public, privacy_level')
      .limit(5)
    
    results.sampleData = sampleRecipes
    
    // 8. Count recipes by status
    const { data: statusCounts } = await client
      .from('recipes')
      .select('qa_status')
      .then(({ data }) => {
        const counts = {}
        data?.forEach(r => {
          counts[r.qa_status] = (counts[r.qa_status] || 0) + 1
        })
        return counts
      })
    
    results.statusCounts = statusCounts
    
  } catch (error) {
    console.error(`Error querying ${name}:`, error.message)
    results.error = error.message
  }
  
  return results
}

async function compareEnvironments() {
  const devResults = await queryEnvironment('dev', 'dev')
  const prodResults = await queryEnvironment('prod', 'production')
  
  console.log('\n\n=== COMPARISON RESULTS ===\n')
  
  // Compare approval columns
  console.log('1. Approval Workflow Columns in Recipes Table:')
  console.log('DEV:', devResults.approvalColumns?.map(c => c.column_name) || 'Missing')
  console.log('PROD:', prodResults.approvalColumns?.map(c => c.column_name) || 'Missing')
  console.log('MATCH:', JSON.stringify(devResults.approvalColumns?.map(c => c.column_name)) === 
              JSON.stringify(prodResults.approvalColumns?.map(c => c.column_name)) ? '✅' : '❌')
  
  // Compare constraints
  console.log('\n2. QA Status Constraint:')
  console.log('DEV:', devResults.qaStatusConstraint?.[0]?.check_clause || 'Missing')
  console.log('PROD:', prodResults.qaStatusConstraint?.[0]?.check_clause || 'Missing')
  
  // Compare views
  console.log('\n3. Approval Views:')
  console.log('DEV:', devResults.approvalViews?.map(v => v.table_name) || 'None')
  console.log('PROD:', prodResults.approvalViews?.map(v => v.table_name) || 'None')
  
  // Compare migrations
  console.log('\n4. Approval Migrations:')
  console.log('DEV:', devResults.approvalMigrations?.map(m => `${m.version}: ${m.name}`) || 'None')
  console.log('PROD:', prodResults.approvalMigrations?.map(m => `${m.version}: ${m.name}`) || 'None')
  
  // Compare data
  console.log('\n5. Recipe Status Distribution:')
  console.log('DEV:', devResults.statusCounts || 'No data')
  console.log('PROD:', prodResults.statusCounts || 'No data')
  
  // Summary
  console.log('\n=== SUMMARY ===')
  const devHasApproval = devResults.approvalColumns?.length > 0
  const prodHasApproval = prodResults.approvalColumns?.length > 0
  
  if (devHasApproval && prodHasApproval) {
    console.log('✅ Both environments have approval workflow columns')
  } else if (!devHasApproval && !prodHasApproval) {
    console.log('❌ Neither environment has approval workflow - run migration!')
  } else {
    console.log('⚠️  Environments differ - check migration status')
  }
  
  // Print detailed results
  console.log('\n=== DETAILED RESULTS ===')
  console.log('\nDEV Environment:', JSON.stringify(devResults, null, 2))
  console.log('\nPRODUCTION Environment:', JSON.stringify(prodResults, null, 2))
}

compareEnvironments()
