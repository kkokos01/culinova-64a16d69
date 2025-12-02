
import React from "react";
import { RecipeVersion } from "@/context/recipe/types";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface VersionTabProps {
  version: RecipeVersion;
  isActive: boolean;
  isSwitching: boolean;
  onSelectVersion: (version: RecipeVersion) => void;
  onStartRename: (version: RecipeVersion) => void;
  onDelete: (id: string) => void;
  onPersist: (version: RecipeVersion) => void;
  isSaving: boolean;
}

const VersionTab: React.FC<VersionTabProps> = ({
  version,
  isActive,
  isSwitching,
  onSelectVersion,
  onStartRename,
  onDelete,
  onPersist,
  isSaving
}) => {
  console.log('VersionTab rendering:', {
    versionName: version.name,
    isTemporary: version.isTemporary,
    showDropdown: version.name !== "Original"
  });
  
  return (
    <div className="flex items-center">
      <div
        role="button"
        tabIndex={isSwitching ? -1 : 0}
        onClick={() => onSelectVersion(version)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectVersion(version);
          }
        }}
        className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 rounded-t-md whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isActive
            ? "border-primary text-primary"
            : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
        } ${isSwitching ? "opacity-70 pointer-events-none" : ""}`}
      >
        {isSwitching ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : null}
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
      </div>
      
      {/* Add obvious X button for non-Original versions */}
      {version.name !== "Original" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('X button clicked for version:', version.id, version.name);
            onDelete(version.id);
          }}
          className="ml-1 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
          title="Delete version"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      
      {/* Keep dropdown for additional options */}
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
            <VersionTabDropdownContent 
              version={version}
              onStartRename={onStartRename}
              onDelete={onDelete}
              onPersist={onPersist}
              isSaving={isSaving}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

interface VersionTabDropdownContentProps {
  version: RecipeVersion;
  onStartRename: (version: RecipeVersion) => void;
  onDelete: (id: string) => void;
  onPersist: (version: RecipeVersion) => void;
  isSaving: boolean;
}

const VersionTabDropdownContent: React.FC<VersionTabDropdownContentProps> = ({
  version,
  onStartRename,
  onDelete,
  onPersist,
  isSaving
}) => {
  const { Edit2, Trash, Loader2, Database } = require("lucide-react");
  
  return (
    <>
      <DropdownMenuItem onClick={() => onStartRename(version)}>
        <Edit2 className="mr-2 h-4 w-4" />
        <span>Rename</span>
      </DropdownMenuItem>
      
      {/* Add save option for temporary versions */}
      {version.isTemporary && (
        <DropdownMenuItem 
          onClick={() => onPersist(version)}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          <span>Save to Database</span>
        </DropdownMenuItem>
      )}
      
      {version.isTemporary && <DropdownMenuSeparator />}
      
      <DropdownMenuItem 
        onClick={() => onDelete(version.id)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash className="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>
    </>
  );
};

export default VersionTab;
