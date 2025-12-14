# PRODUCTION DEPLOYMENT CHECKLIST
# ========================================
# After accidental deployment to production, use this to verify everything works

## IMMEDIATE ACTIONS NEEDED:

### 1. Run Schema Export in BOTH Environments
- Open: https://supabase.com/dashboard/project/aajeyifqrupykjyapoft/sql (DEV)
- Open: https://supabase.com/dashboard/project/zujlsbkxxsmiiwgyodph/sql (PROD)
- Copy and run: /recipe-miner/export_schema_comparison.sql
- Save results as: schema_export_dev.json and schema_export_prod.json

### 2. Key Items to Compare:

#### A. Approval Workflow Tables
- [ ] `recipes` table has `approved_by` column (UUID)
- [ ] `recipes` table has `approved_at` column (TIMESTAMPTZ)
- [ ] `qa_status` constraint includes: 'approved_public', 'rejected_public'
- [ ] Index exists on `qa_status`
- [ ] Index exists on `(qa_status, is_public)`

#### B. Views
- [ ] `pending_approval_recipes` view exists
- [ ] `public_recipes` view exists
- [ ] Both views have correct SELECT permissions

#### C. RLS Policies
- [ ] "Space admins can approve recipes" policy exists
- [ ] Policy correctly checks user_spaces table for admin role
- [ ] Policy applies to UPDATE operations only

#### D. RPC Functions
- [ ] `approve_recipe_public` function exists (if using RPC)
- [ ] `reject_recipe_public` function exists (if using RPC)
- [ ] Functions have correct SECURITY DEFINER settings

### 3. Frontend Configuration
- [ ] Environment variables point to production URL
- [ ] Supabase client uses production anon key
- [ ] All approval workflow routes work

### 4. Test the Full Workflow in Production:
1. [ ] Upload a recipe (should get 'pending' status)
2. [ ] Admin dashboard loads at /admin/dashboard
3. [ ] Pending recipes show in admin review
4. [ ] Approve button works
5. [ ] Approved recipe appears at /public-recipes
6. [ ] Notification badge updates correctly

### 5. Edge Functions (if any)
- [ ] Check Functions tab in both dashboards
- [ ] Compare function lists
- [ ] Verify any custom functions are deployed

### 6. Migration Status
- [ ] Check supabase_migrations.schema_migrations table
- [ ] Verify approval workflow migration ran
- [ ] Note any missing migrations

## CRITICAL DIFFERENCES TO EXPECT:

1. **Production may have more data** - This is fine
2. **Production may have orphaned records** - Check for these
3. **Production might have different RLS policies** - Verify admin checks
4. **Production might lack new views/functions** - Run migration if needed

## IF PRODUCTION MISSING COMPONENTS:

Run the approval workflow migration in production:
```sql
-- Copy from: /supabase/migrations/20251214000000_approval_workflow.sql
```

## NEXT STEPS AFTER COMPARISON:

1. Document all differences found
2. Run any missing migrations in production
3. Test the full approval workflow
4. Update dev environment to match production if needed
5. Consider making production the primary environment going forward

## REMEMBER:
- Production URL: https://zujlsbkxxsmiiwgyodph.supabase.co
- Dev URL: https://aajeyifqrupykjyapoft.supabase.co
- Always verify in production UI after database changes
