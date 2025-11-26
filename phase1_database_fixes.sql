-- Phase 1: Enable PostgreSQL Extensions
-- This fixes the "function text2ltree(text) does not exist" error

-- Enable the ltree extension for hierarchical data structures
CREATE EXTENSION IF NOT EXISTS ltree;

-- Verify the extension is working
SELECT text2ltree('food.category.item') as test_ltree_function;

-- Phase 2: Fix Unit Type Enum (Alternative Option)
-- Uncomment this line if you prefer to add 'weight' to the enum instead of using 'mass'
-- ALTER TYPE unit_type ADD VALUE 'weight';

-- Check current enum values
SELECT unnest(enumlabel) AS unit_type_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'unit_type')
ORDER BY enumlabel;
