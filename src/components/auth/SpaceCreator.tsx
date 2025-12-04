
import { useState } from "react";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

export function SpaceCreator({ refreshSpaces }: { refreshSpaces?: () => Promise<void> }) {
  const { createSpace } = useSpace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spaceName.trim()) {
      toast({
        title: "Space name required",
        description: "Please enter a name for your space",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await createSpace(spaceName);
      if (result) {
        setIsOpen(false);
        setSpaceName("");
        // Call the parent refreshSpaces callback if provided
        if (refreshSpaces) {
          await refreshSpaces();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleCreateSpace}>
          <DialogHeader>
            <DialogTitle>Create a new space</DialogTitle>
            <DialogDescription>
              Create a space to organize your recipes, meal plans, and shopping lists.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                placeholder="My Family Recipes"
                className="col-span-3"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !spaceName.trim()}>
              {isLoading ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
