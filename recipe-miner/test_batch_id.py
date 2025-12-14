import supabase

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Check the column information from the database
# Since we can't directly query information_schema with the JS client,
# let's try inserting a test recipe without batch_id first
try:
    test_data = {
        "title": "Test Recipe No Batch",
        "description": "Test",
        "prep_time_minutes": 10,
        "cook_time_minutes": 20,
        "servings": 4,
        "difficulty": "easy",
        "user_id": "3a9d183d-24d4-4cb6-aaf0-38635aa47c26",
        "space_id": "e5d604e7-36eb-4ce2-b40b-4ab491d80c27",
        "is_public": False,
        "privacy_level": "space",
        "tags": [],
        "qa_status": "pending"
    }
    
    result = client.table('recipes').insert(test_data).execute()
    print("✅ Recipe created without batch_id:", result.data[0]['id'])
    
    # Now try with batch_id
    test_data_with_batch = {**test_data, "title": "Test Recipe With Batch", "batch_id": "test-string"}
    result2 = client.table('recipes').insert(test_data_with_batch).execute()
    print("✅ Recipe created with string batch_id:", result2.data[0]['id'])
    
except Exception as e:
    print(f"❌ Error: {e}")
