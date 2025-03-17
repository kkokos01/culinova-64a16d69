
import React from "react";
import { RecipeVersion } from "@/context/recipe/types";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal } from "lucide-react";
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
  return (
    <button
      onClick={() => onSelectVersion(version)}
      disabled={isSwitching}
      className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 rounded-t-md whitespace-nowrap ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
      } ${isSwitching ? "opacity-70" : ""}`}
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
    </button>
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
