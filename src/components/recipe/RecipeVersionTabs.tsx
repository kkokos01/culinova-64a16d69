
import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecipe } from "@/context/recipe";
import { RecipeVersion } from "@/context/recipe/types";
import { MoreVertical, Pencil, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RecipeVersionTabs: React.FC = () => {
  const { recipeVersions, activeVersionId, setActiveVersion, renameVersion, deleteVersion } = useRecipe();
  const { toast } = useToast();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState("");

  const handleVersionSelect = (versionId: string) => {
    // Don't reselect the already active version to avoid unnecessary rerenders
    if (versionId !== activeVersionId) {
      setActiveVersion(versionId);
    }
  };

  // Handle dropdown actions with separate handlers that prevent event propagation
  const handleOpenDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleRenameClick = (version: RecipeVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVersionId(version.id);
    setNewVersionName(version.name);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (version: RecipeVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow deleting the Original version
    if (version.name === "Original") {
      toast({
        title: "Cannot delete original",
        description: "The original recipe version cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    deleteVersion(version.id);
    toast({
      title: "Version deleted",
      description: `${version.name} version has been deleted.`,
    });
  };

  const handleSaveClick = (version: RecipeVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Recipe saved",
      description: `${version.name} version has been saved to your collection.`,
    });
  };

  const handleRenameConfirm = () => {
    if (selectedVersionId && newVersionName.trim()) {
      renameVersion(selectedVersionId, newVersionName.trim());
      setRenameDialogOpen(false);
      toast({
        title: "Version renamed",
        description: `Recipe version has been renamed to "${newVersionName.trim()}".`,
      });
    }
  };

  // If no versions available yet, show a placeholder
  if (recipeVersions.length === 0) {
    return (
      <div className="mb-4 pb-1">
        <div className="w-full">
          <div className="w-full mb-2 overflow-x-auto overflow-y-hidden flex-wrap">
            <div className="border border-gray-200 rounded-md px-4 py-2 m-1 inline-flex items-center justify-center">
              Original
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 pb-1">
      <div className="w-full">
        <div className="w-full mb-2 overflow-x-auto overflow-y-hidden flex flex-wrap">
          {recipeVersions.map((version) => (
            <div 
              key={version.id}
              onClick={() => handleVersionSelect(version.id)}
              className={`flex items-center gap-1 border border-gray-200 rounded-md px-4 py-2 m-1 cursor-pointer ${
                version.isActive ? 'bg-sage-100 border-sage-300' : ''
              }`}
            >
              <span>{version.name}</span>
              <div className="inline-block ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={handleOpenDropdown}>
                    <div className="p-1">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={(e) => handleRenameClick(version, e)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleDeleteClick(version, e)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleSaveClick(version, e)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Recipe Version</DialogTitle>
            <DialogDescription>
              Enter a new name for this recipe version.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version-name" className="text-right">
                Name
              </Label>
              <Input
                id="version-name"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeVersionTabs;
