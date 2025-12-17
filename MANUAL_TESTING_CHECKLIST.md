# Culinova Manual Testing Checklist

## Automated Tests Status ✅
- 14 unit tests passing
- Core logic tested:
  - Recipe normalization (normalizeRecipeForDb)
  - Ingredient selection tracking
  - Modification instruction building
  - Quantity parsing (simple, decimal, range, text)

## Manual Testing Required (5 items)

### 1. Generate Recipe with Constraints
- [ ] Generate a vegan recipe
- [ ] Generate a gluten-free recipe  
- [ ] Generate a quick meal (<30 minutes)
- [ ] Verify dietary constraints appear in the recipe

### 2. Recipe Modifications with Combined Inputs
- [ ] Select ingredients to increase/decrease/remove
- [ ] Add text instructions (e.g., "make it spicier")
- [ ] Use quick modifications dropdown
- [ ] Verify ALL modifications are applied in the result

### 3. Save and Verify Persistence
- [ ] Save a generated recipe to your collection
- [ ] Save a modified recipe to your collection
- [ ] Check that saved recipes appear in your collection
- [ ] Verify version history for modified recipes

### 4. UI/UX Checks
- [ ] Test recipe panel resizing (95/5 split)
- [ ] Check mobile responsiveness (if possible)
- [ ] Verify image generation works
- [ ] Check loading states during operations

### 5. Edge Cases
- [ ] Try modifying with no selections (should be disabled)
- [ ] Test network error handling (disconnect during generation)
- [ ] Verify special characters in ingredient names work

## Running Automated Tests
```bash
npm run test:run
```

## Test Results
If all manual tests pass, the feature is ready for production.
