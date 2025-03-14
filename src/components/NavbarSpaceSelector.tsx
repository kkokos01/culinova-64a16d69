
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, PlusCircle } from "lucide-react";
import { SpaceCreator } from "@/components/auth/SpaceCreator";

export default function NavbarSpaceSelector() {
  const { currentSpace, spaces, setCurrentSpace } = useSpace();
  
  if (!currentSpace || spaces.length === 0) return null;

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <span className="max-w-28 truncate">{currentSpace.name}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Your Spaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {spaces.map((space) => (
            <DropdownMenuItem
              key={space.id}
              className={space.id === currentSpace.id ? "bg-secondary" : ""}
              onClick={() => setCurrentSpace(space)}
            >
              {space.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <SpaceCreator />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
