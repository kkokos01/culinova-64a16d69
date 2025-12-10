# Manual Data Copy Instructions

Since both CLI and REST API authentication are failing, use this manual approach:

## Step 1: Export from Production
1. Go to https://supabase.com/dashboard/project/zujlsbkxxsmiiwgyodph
2. Click "Table Editor"
3. For each table, click the table name → "Export" → "CSV"
4. Export these tables in order:
   - spaces
   - user_profiles  
   - user_spaces
   - space_invitations
   - recipes
   - recipe_versions
   - ingredients
   - pantry_items

## Step 2: Import to Dev
1. Go to https://supabase.com/dashboard/project/aajeyifqrupykjyapoft
2. Click "Table Editor"
3. For each table, click the table name → "Import" → Upload CSV
4. Import in the same order, mapping columns as needed:

### Column Mappings for Schema Differences:

**user_profiles → profiles:**
- user_id → id
- display_name → username  
- display_name → full_name
- avatar_url → avatar_url
- updated_at → updated_at

**user_spaces → space_members:**
- id → id
- space_id → space_id
- user_id → user_id  
- role → role
- created_at → joined_at

**space_invitations → invitations:**
- id → id
- space_id → space_id
- inviter_id → invited_by
- email_address → invited_email
- token → token (generate: "token-" + id)
- status → status
- created_at → created_at
- expires_at → expires_at

## Step 3: Verification
After importing, verify data counts match between production and dev.

This approach bypasses all authentication issues and uses the dashboard's proven import/export functionality.
