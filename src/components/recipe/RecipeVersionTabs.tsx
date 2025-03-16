
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeVersion, useRecipe } from "@/context/RecipeContext";
import { MoreVertical, Pencil, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RecipeVersionTabs: React.FC = () => {
  const { recipeVersions, setActiveVersion, renameVersion, deleteVersion } = useRecipe();
  const { toast } = useToast();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState("");

  const handleVersionSelect = (versionId: string) => {
    setActiveVersion(versionId);
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
      <div className="mb-4 border-b pb-1">
        <Tabs defaultValue="original">
          <TabsList>
            <TabsTrigger value="original">Original</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="mb-4 border-b pb-1">
      <Tabs value={recipeVersions.find(v => v.isActive)?.id}>
        <TabsList>
          {recipeVersions.map((version) => (
            <TabsTrigger 
              key={version.id} 
              value={version.id}
              onClick={() => handleVersionSelect(version.id)}
              className="flex items-center gap-1"
            >
              {version.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={(e) => handleRenameClick(version, e as React.MouseEvent)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleDeleteClick(version, e as React.MouseEvent)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleSaveClick(version, e as React.MouseEvent)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
