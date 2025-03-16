
import React, { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash } from "lucide-react";
import { useRecipe } from "@/context/recipe";
import { RecipeVersion } from "@/context/recipe/types";

const RecipeVersionTabs = () => {
  const { 
    recipeVersions, 
    activeVersionId, 
    setActiveVersion, 
    renameVersion, 
    deleteVersion 
  } = useRecipe();
  
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  
  // Handle initiating rename
  const handleStartRename = (version: RecipeVersion) => {
    setIsRenaming(version.id);
    setNewName(version.name);
  };
  
  // Handle rename submission
  const handleSubmitRename = (id: string) => {
    if (newName.trim()) {
      renameVersion(id, newName.trim());
    }
    setIsRenaming(null);
  };
  
  // Handle key press in rename field
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSubmitRename(id);
    } else if (e.key === "Escape") {
      setIsRenaming(null);
    }
  };
  
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
                
                {version.id !== "original" && (
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
