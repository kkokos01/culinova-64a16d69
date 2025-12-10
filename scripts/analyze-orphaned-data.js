// scripts/analyze-orphaned-data.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function analyzeOrphanedData() {
  console.log('🔍 ANALYZING ORPHANED DATA - IS IT ACTIVE OR LEGACY?\n')

  try {
    // Step 1: Get all user_spaces records
    console.log('📊 Step 1: Getting all user_spaces records...')
    const { data: allUserSpaces, error: userSpacesError } = await prodClient
      .from('user_spaces')
      .select('*')
    
    if (userSpacesError) {
      console.error('❌ Failed to get user_spaces:', userSpacesError)
      return
    }
    
    console.log(`✅ Found ${allUserSpaces?.length || 0} total user_spaces records`)

    // Step 2: Get all existing spaces
    console.log('\n📊 Step 2: Getting all existing spaces...')
    const { data: allSpaces, error: spacesError } = await prodClient
      .from('spaces')
      .select('id, name, created_at')
    
    if (spacesError) {
      console.error('❌ Failed to get spaces:', spacesError)
      return
    }
    
    console.log(`✅ Found ${allSpaces?.length || 0} existing spaces`)

    // Step 3: Analyze orphaned records
    console.log('\n🔍 Step 3: Analyzing orphaned records...')
    
    const existingSpaceIds = new Set(allSpaces?.map(s => s.id) || [])
    const orphanedRecords = []
    const validRecords = []
    
    for (const userSpace of allUserSpaces || []) {
      if (existingSpaceIds.has(userSpace.space_id)) {
        validRecords.push(userSpace)
      } else {
        orphanedRecords.push(userSpace)
      }
    }
    
    console.log(`📈 Analysis Results:`)
    console.log(`   ✅ Valid records: ${validRecords.length}`)
    console.log(`   ❓ Orphaned records: ${orphanedRecords.length}`)

    // Step 4: Check if orphaned records belong to active users
    console.log('\n👤 Step 4: Checking user activity for orphaned records...')
    
    const orphanedUserIds = [...new Set(orphanedRecords.map(r => r.user_id))]
    
    // Get user profiles for these users
    const { data: userProfiles, error: profilesError } = await prodClient
      .from('user_profiles')
      .select('*')
      .in('user_id', orphanedUserIds)
    
    if (profilesError) {
      console.error('❌ Failed to get user profiles:', profilesError)
      return
    }
    
    console.log(`📊 Found ${userProfiles?.length || 0} user profiles for orphaned records`)

    // Step 5: Analyze user activity
    console.log('\n📅 Step 5: Analyzing user activity patterns...')
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
    
    let activeUsers = 0
    let recentUsers = 0
    let oldUsers = 0
    
    for (const profile of userProfiles || []) {
      const lastActive = new Date(profile.updated_at || profile.created_at)
      
      if (lastActive > thirtyDaysAgo) {
        activeUsers++
      } else if (lastActive > ninetyDaysAgo) {
        recentUsers++
      } else {
        oldUsers++
      }
    }
    
    console.log(`📈 User Activity Analysis:`)
    console.log(`   🔥 Active (last 30 days): ${activeUsers}`)
    console.log(`   📅 Recent (30-90 days): ${recentUsers}`)
    console.log(`   📜 Old (90+ days): ${oldUsers}`)

    // Step 6: Check creation dates of orphaned records
    console.log('\n📅 Step 6: Analyzing orphaned record creation dates...')
    
    const orphanedDates = orphanedRecords.map(r => new Date(r.created_at))
    const oldestOrphaned = new Date(Math.min(...orphanedDates))
    const newestOrphaned = new Date(Math.max(...orphanedDates))
    
    console.log(`📈 Orphaned Record Date Range:`)
    console.log(`   📜 Oldest: ${oldestOrphaned.toDateString()}`)
    console.log(`   🆕 Newest: ${newestOrphaned.toDateString()}`)
    
    // Step 7: Sample some orphaned records
    console.log('\n🔍 Step 7: Sample orphaned records...')
    console.log('Sample orphaned user_spaces (first 5):')
    
    for (let i = 0; i < Math.min(5, orphanedRecords.length); i++) {
      const record = orphanedRecords[i]
      const profile = userProfiles?.find(p => p.user_id === record.user_id)
      
      console.log(`  ${i+1}. User: ${record.user_id}`)
      console.log(`     Space: ${record.space_id} (MISSING)`)
      console.log(`     Role: ${record.role}`)
      console.log(`     Created: ${new Date(record.created_at).toDateString()}`)
      console.log(`     User Profile: ${profile ? 'EXISTS' : 'MISSING'}`)
      console.log(`     User Last Active: ${profile ? new Date(profile.updated_at || profile.created_at).toDateString() : 'N/A'}`)
      console.log('')
    }

    // Step 8: Recommendation
    console.log('🎯 RECOMMENDATION:')
    
    if (activeUsers > 0) {
      console.log('⚠️  CAUTION: Some orphaned records belong to ACTIVE users!')
      console.log('💡 Recommendation: Do NOT skip these records. They may be important.')
      console.log('🔧 Solution: Create placeholder spaces or investigate why spaces are missing.')
    } else if (recentUsers > 0) {
      console.log('⚠️  CAUTION: Some orphaned records belong to recent users.')
      console.log('💡 Recommendation: Be cautious. May be recent data corruption.')
    } else {
      console.log('✅ SAFE: Orphaned records belong to old/inactive users.')
      console.log('💡 Recommendation: Likely legacy test data. Safe to skip.')
    }
    
  } catch (err) {
    console.error('❌ Analysis error:', err.message)
  }
}

analyzeOrphanedData().catch(console.error)
