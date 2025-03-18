
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "../utils/versionUtils";

// Set active version
export async function setVersionActive(versionId: string, recipeId: string): Promise<void> {
  // Check if we're using mock IDs
  if (!isValidUUID(versionId) || !isValidUUID(recipeId)) {
    console.log("Using mock IDs, skipping database update");
    return;
  }
  
  try {
    // Update database first
    const { error } = await supabase
      .from('recipe_versions')
      .update({ is_current: true })
      .eq('id', versionId);
    
    if (error) throw error;
    
    // Deactivate other versions in the database
    const { error: otherVersionsError } = await supabase
      .from('recipe_versions')
      .update({ is_current: false })
      .eq('recipe_id', recipeId)
      .neq('id', versionId);
    
    if (otherVersionsError) throw otherVersionsError;
  } catch (error) {
    console.error("Error in setVersionActive:", error);
    throw error;
  }
}

// Rename version
export async function renameVersion(versionId: string, newName: string): Promise<void> {
  // Check if we're using a mock ID
  if (!isValidUUID(versionId)) {
    console.log("Using mock ID, skipping database update");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('recipe_versions')
      .update({ display_name: newName })
      .eq('id', versionId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error in renameVersion:", error);
    throw error;
  }
}

// Delete version
export async function deleteVersion(versionId: string): Promise<void> {
  // Check if we're using a mock ID
  if (!isValidUUID(versionId)) {
    console.log("Using mock ID, skipping database delete");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('recipe_versions')
      .delete()
      .eq('id', versionId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error in deleteVersion:", error);
    throw error;
  }
}
