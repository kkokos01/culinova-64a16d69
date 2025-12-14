import json

# Load the batch file
with open('validated_recipes/checked_20251214_102900_batch_1765726099.json', 'r') as f:
    batch = json.load(f)

# Get the first recipe
if len(batch) > 0:
    item = batch[0]
    recipe = item['recipe']
    
    # Check ingredient structure
    print("Ingredient data structure:")
    print(json.dumps(recipe['ingredients'][0], indent=2))
