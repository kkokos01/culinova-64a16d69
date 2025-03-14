
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, HomeIcon } from "lucide-react";

export function SpaceIndicator() {
  const { currentSpace, spaces, setCurrentSpace } = useSpace();
  
  if (!currentSpace) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <HomeIcon className="mr-2 h-4 w-4" />
          {currentSpace.name}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium">Your spaces</div>
          <div className="text-xs text-muted-foreground">
            Select a space to switch context
          </div>
        </div>
        <div className="grid gap-1 p-2">
          {spaces.map((space) => (
            <Button
              key={space.id}
              variant={space.id === currentSpace.id ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => setCurrentSpace(space)}
            >
              {space.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
