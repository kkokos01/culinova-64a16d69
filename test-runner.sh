#!/bin/bash

echo "🧪 Running Culinova Automated Tests"
echo "=================================="

# Check if vitest is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Run the tests
echo "Running unit tests..."
npx vitest run --reporter=verbose

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All automated tests passed!"
    echo ""
    echo "📋 Manual Testing Checklist:"
    echo "1. Generate a recipe with dietary constraints (vegan/gluten-free)"
    echo "2. Modify a recipe: combine ingredient selection (+/-/X) with text instructions"
    echo "3. Save a modified recipe and verify it appears in your collection"
    echo "4. Test UI responsiveness on mobile (if possible)"
    echo "5. Verify image generation works for new recipes"
else
    echo ""
    echo "❌ Some tests failed. Please review the errors above."
    exit 1
fi
