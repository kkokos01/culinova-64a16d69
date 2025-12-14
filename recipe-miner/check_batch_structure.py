import json

# Load the batch file
with open('validated_recipes/checked_20251214_102900_batch_1765726099.json', 'r') as f:
    batch = json.load(f)

# Print structure of first item
if len(batch) > 0:
    first_item = batch[0]
    print("Keys in first item:", list(first_item.keys()))
    
    # If it's nested, check nested structure
    if 'data' in first_item:
        print("\nKeys in 'data':", list(first_item['data'].keys()))
        if 'recipe' in first_item['data']:
            print("\nKeys in 'recipe':", list(first_item['data']['recipe'].keys()))
