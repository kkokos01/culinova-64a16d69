# Culinova Recipe Miner - QA Pipeline

A professional-grade content supply chain for generating, validating, and uploading recipes to Culinova.

## Architecture

The pipeline consists of three specialized workers:

1. **Miner** (`miner_v4.py`) - Generates recipes from web sources using AI consensus
2. **Validator** (`validator.py`) - Uses LLM-as-a-Judge to validate recipes for safety and quality
3. **Uploader** (`uploader.py`) - Atomically uploads validated recipes to staging space

## Setup

### 1. Install Dependencies

```bash
cd recipe-miner
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env with your actual values
nano .env
```

Required environment variables:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `SUPABASE_URL` - Development Supabase URL (should contain `aajeyifqrupykjyapoft`)
- `SUPABASE_KEY` - Development service role key
- `TARGET_USER_ID` - Your user UUID from Supabase
- `STAGING_SPACE_ID` - UUID of your staging space

### 3. Database Setup

Ensure you have run these SQL commands in your Dev Supabase dashboard:

```sql
-- Add QA columns to recipes table (if not exists)
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS batch_id uuid,
ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'pending';

-- Create the atomic transaction function
-- (See the SQL function in implementation guide)

-- Create staging space (if not exists)
INSERT INTO spaces (name, created_by, max_recipes, max_users, is_active, is_default)
VALUES ('Kitchen Stage', 'YOUR_USER_UUID', 1000, 10, true, false);
```

## Usage

### Generate Recipes

```bash
python miner_v4.py
```

This will:
- Search for authentic recipes
- Scrape content from multiple sources
- Generate consensus recipes using AI
- Save to `draft_recipes/batch_[timestamp].json`

### Validate Recipes

```bash
python validator.py
```

This will:
- Load the latest batch from `draft_recipes/`
- Validate each recipe for safety, logic, and authenticity
- Flag suspicious recipes with reasons
- Save to `validated_recipes/checked_[timestamp].json`

### Upload to Staging

```bash
python uploader.py
```

This will:
- Load the latest validated batch
- Resolve ingredient and unit names to IDs
- Upload to staging space using atomic transactions
- Tag recipes with `#QA_PASS` or `#QA_FLAG`
- Save upload records for tracking

## Review Workflow

1. Open Culinova app
2. Switch to "Kitchen Stage" collection
3. Filter by tag `#QA_FLAGGED`
4. Review and edit flagged recipes
5. Move approved recipes to public collections

## File Structure

```
recipe-miner/
├── draft_recipes/          # Raw generated recipes
├── validated_recipes/      # QA validated recipes
├── upload_records/         # Upload tracking
├── .env                    # Configuration (gitignored)
├── .env.example           # Configuration template
├── utils.py               # Shared database utilities
├── miner_v4.py           # Recipe generator
├── validator.py          # Recipe validator
├── uploader.py           # Recipe uploader
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Safety Features

- **Environment Lock**: Scripts only target development environment
- **Atomic Transactions**: Prevents partial recipe uploads
- **File-Based Pipeline**: Bad data never touches database
- **Batch Tracking**: Easy rollback with batch IDs
- **QA Flags**: Clear visibility of issues

## Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Check your `.env` file is properly configured
- Ensure all required variables are set

**"Safety Lock: Not targeting Dev environment"**
- Verify `SUPABASE_URL` contains `aajeyifqrupykjyapoft`
- Don't use production credentials

**"column does not exist"**
- Run the database setup SQL commands
- Verify schema includes `tags`, `batch_id`, `qa_status`

**"RPC function not found"**
- Ensure the `create_recipe_with_ingredients` function exists
- Check you're targeting the correct database

### Debug Mode

Add debug prints by setting environment variable:
```bash
export DEBUG=1
python miner_v4.py
```

## Performance Tips

- **Batch Size**: Start with 5-10 recipes per batch
- **Rate Limiting**: Built-in delays prevent API blocks
- **Caching**: Food and unit IDs are cached per batch
- **Validation**: Uses Gemini Flash for faster validation

## Next Steps

1. Test with small batches first
2. Monitor QA flag rates
3. Adjust validation criteria as needed
4. Scale up batch sizes gradually
5. Set up automated scheduling for regular mining
