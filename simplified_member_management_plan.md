# Simplified Member Management Plan

## Problem Analysis
- Current approach over-engineered with complex RPC functions
- user_profiles table is never populated on signup
- Manual SQL fixes required for basic functionality
- Not following existing app patterns

## Solution: Follow Existing App Patterns

### How the App Currently Works:
1. **Navbar**: Uses `user.email?.charAt(0).toUpperCase()` from auth session
2. **RecipeCreatePage**: Uses `user.user_metadata?.name || user.email?.split("@")[0] || "User"`
3. **All components**: Get user data from `useAuth()` hook, not database

### New Approach:
1. **Remove database dependencies** for user display
2. **Keep only get_auth_users** for phantom detection
3. **Use Supabase auth methods** for user data
4. **Follow exact patterns** from Navbar/RecipeCreatePage

### Implementation Steps:
1. Update MemberManagement to use auth session logic
2. Remove complex email-fetching RPC functions
3. Use supabase.auth.admin.getUserById() for member emails
4. Apply same display logic as RecipeCreatePage

### Benefits:
- Works automatically for all users
- No manual SQL fixes needed
- Follows established app patterns
- Maintenance-free going forward
