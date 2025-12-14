-- Update existing recipes to new user ID
-- This updates the 4 recipes we just uploaded to staging

UPDATE recipes 
SET user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
WHERE user_id = 'b7d099f6-a8e6-4780-8e83-403cbf351f3c'
AND space_id = 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27';

-- Verify the update
SELECT id, title, user_id, space_id 
FROM recipes 
WHERE user_id = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
AND space_id = 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27';
