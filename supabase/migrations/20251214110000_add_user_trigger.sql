-- Add missing trigger for automatic user profile creation
-- This was missing from the baseline migration

-- Create the trigger that calls handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
