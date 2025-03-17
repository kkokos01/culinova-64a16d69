import React, { useState, useEffect } from "react";
import { useRecipe } from "@/context/recipe";
import { RecipeVersion } from "@/context/recipe/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import VersionTab from "./version/VersionTab";
import RenameVersionField from "./version/RenameVersionField";

const RecipeVersionTabs = () => {
  const { 
    recipeVersions, 
    activeVersionId, 
    isLoadingVersions,
    setActiveVersion, 
    renameVersion, 
    deleteVersion,
    persistVersion,
    recipe
  } = useRecipe();
  
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setSaving] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  
  // Deduplicate versions for display based on id
  const displayVersions = React.useMemo(() => {
    // Use a Map to ensure we only keep one version per ID
    const uniqueVersionMap = new Map<string, RecipeVersion>();
    
    // Add all versions to the map, keyed by ID
    recipeVersions.forEach(version => {
      uniqueVersionMap.set(version.id, version);
    });
    
    // Convert map values back to array
    return Array.from(uniqueVersionMap.values());
  }, [recipeVersions]);
  
  // Add effect to log current state for debugging
  useEffect(() => {
    if (recipe) {
      console.log("Current active recipe in tabs:", recipe.title);
    }
    console.log("Current active version ID:", activeVersionId);
    console.log("Number of versions to display:", displayVersions.length);
  }, [recipe, activeVersionId, displayVersions.length]);
  
  // Handle initiating rename
  const handleStartRename = (version: RecipeVersion) => {
    setIsRenaming(version.id);
    setNewName(version.name);
  };
  
  // Handle rename submission
  const handleSubmitRename = async (id: string) => {
    if (newName.trim()) {
      await renameVersion(id, newName.trim());
    }
    setIsRenaming(null);
  };
  
  // Handle persisting a temporary version
  const handlePersistVersion = async (version: RecipeVersion) => {
    try {
      setSaving(version.id);
      await persistVersion(version.id);
      toast({
        title: "Version Saved",
        description: `"${version.name}" has been saved to the database.`,
      });
    } catch (error) {
      console.error("Error saving version:", error);
      toast({
        title: "Error Saving Version",
        description: error instanceof Error ? error.message : "Failed to save version",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };
  
  // Handle key press in rename field
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSubmitRename(id);
    } else if (e.key === "Escape") {
      setIsRenaming(null);
    }
  };
  
  // Handle version selection with improved error handling and feedback
  const handleSelectVersion = async (version: RecipeVersion) => {
    // Skip if already on this version
    if (version.id === activeVersionId) {
      console.log("Version already active, skipping:", version.name);
      return;
    }
    
    console.log("Selecting version:", version.id, version.name);
    
    try {
      // Set loading state
      setIsSwitching(version.id);
      
      // Show toast notification
      toast({
        title: "Switching version",
        description: `Loading "${version.name}" version...`,
      });
      
      // Set the active version - this should update the recipe in context
      await setActiveVersion(version.id);
      
      // Add a small delay to ensure the state update has propagated
      setTimeout(() => {
        // Confirm switch was successful
        toast({
          title: "Version loaded",
          description: `Now viewing "${version.name}" version`,
        });
        
        // Log the recipe title after switching
        if (recipe) {
          console.log("Recipe after version switch:", recipe.title);
        }
        
        // Clear loading state
        setIsSwitching(null);
      }, 300); // Increased delay for more reliable state updates
    } catch (error) {
      console.error("Error setting active version:", error);
      toast({
        title: "Error",
        description: "Failed to switch version",
        variant: "destructive"
      });
      setIsSwitching(null);
    }
  };
  
  if (isLoadingVersions) {
    return (
      <div className="border-b mb-6">
        <div className="flex items-center overflow-x-auto pb-1 hide-scrollbar">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-28 rounded ml-2" />
        </div>
      </div>
    );
  }
  
  // Don't render if there's only 1 or 0 versions
  if (displayVersions.length <= 1) {
    return null;
  }
  
  return (
    <div className="border-b mb-6">
      <div className="flex items-center overflow-x-auto pb-1 hide-scrollbar">
        {displayVersions.map((version) => (
          <div key={version.id} className="flex-shrink-0">
            {isRenaming === version.id ? (
              <RenameVersionField
                newName={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleSubmitRename(version.id)}
                onKeyDown={(e) => handleKeyDown(e, version.id)}
              />
            ) : (
              <VersionTab
                version={version}
                isActive={version.id === activeVersionId}
                isSwitching={isSwitching === version.id}
                onSelectVersion={handleSelectVersion}
                onStartRename={handleStartRename}
                onDelete={deleteVersion}
                onPersist={handlePersistVersion}
                isSaving={isSaving === version.id}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeVersionTabs;
