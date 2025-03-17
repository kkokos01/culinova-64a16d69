
import React, { useState, useEffect } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash, Loader2, Save, Database } from "lucide-react";
import { useRecipe } from "@/context/recipe";
import { RecipeVersion } from "@/context/recipe/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const RecipeVersionTabs = () => {
  const { 
    recipeVersions, 
    activeVersionId, 
    isLoadingVersions,
    setActiveVersion, 
    renameVersion, 
    deleteVersion,
    persistVersion
  } = useRecipe();
  
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setSaving] = useState<string | null>(null);
  
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
  if (recipeVersions.length <= 1) {
    return null;
  }
  
  return (
    <div className="border-b mb-6">
      <div className="flex items-center overflow-x-auto pb-1 hide-scrollbar">
        {recipeVersions.map((version) => (
          <div key={version.id} className="flex-shrink-0">
            {isRenaming === version.id ? (
              <div className="flex items-center px-3 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => handleSubmitRename(version.id)}
                  onKeyDown={(e) => handleKeyDown(e, version.id)}
                  className="border rounded px-2 py-1 text-sm w-[120px]"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveVersion(version.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 rounded-t-md whitespace-nowrap ${
                  version.id === activeVersionId
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {version.name}
                
                {/* Display temporary badge */}
                {version.isTemporary && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200"
                  >
                    Temporary
                  </Badge>
                )}
                
                {version.name !== "Original" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={() => handleStartRename(version)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      
                      {/* Add save option for temporary versions */}
                      {version.isTemporary && (
                        <DropdownMenuItem 
                          onClick={() => handlePersistVersion(version)}
                          disabled={isSaving === version.id}
                        >
                          {isSaving === version.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Database className="mr-2 h-4 w-4" />
                          )}
                          <span>Save to Database</span>
                        </DropdownMenuItem>
                      )}
                      
                      {version.isTemporary && <DropdownMenuSeparator />}
                      
                      <DropdownMenuItem 
                        onClick={() => deleteVersion(version.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeVersionTabs;
