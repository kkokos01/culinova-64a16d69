
import { Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

export const TIME_OPTIONS = [
  { value: "all", label: "All Times" },
  { value: "under15", label: "Under 15 Minutes" },
  { value: "under30", label: "Under 30 Minutes" },
  { value: "under60", label: "Under 1 Hour" },
  { value: "over60", label: "Over 1 Hour" }
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "time_asc", label: "Shortest Time" },
  { value: "time_desc", label: "Longest Time" }
];

export const ALL_TAGS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free", "healthy", 
  "quick", "dinner", "breakfast", "lunch", "dessert", "snack", 
  "italian", "asian", "mexican", "french", "american", "mediterranean",
  "chicken", "beef", "pork", "seafood", "pasta", "soup", "salad", 
  "baking", "spicy", "low-carb", "high-protein"
];

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  timeFilter: string;
  setTimeFilter: (value: string) => void;
  sortOption: string;
  setSortOption: (value: string) => void;
  selectedTags: string[];
  handleTagToggle: (tag: string) => void;
}

const SearchFilters = ({
  searchQuery,
  setSearchQuery,
  difficulty,
  setDifficulty,
  timeFilter,
  setTimeFilter,
  sortOption,
  setSortOption,
  selectedTags,
  handleTagToggle
}: SearchFiltersProps) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>
      
      <div className="flex flex-wrap gap-3 md:gap-4">
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full md:w-[180px] bg-white">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-white">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto bg-white flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <span className="ml-2 bg-sage-100 text-sage-800 rounded-full px-2 py-0.5 text-xs">
                    {selectedTags.length}
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-3">Select Tags</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-60 overflow-y-auto pr-2">
                {ALL_TAGS.map(tag => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag}`} 
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <Label 
                      htmlFor={`tag-${tag}`} 
                      className="text-sm cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between pt-4 border-t mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTagToggle('')}  // This will clear all tags in the parent component
                  className="text-xs"
                >
                  Clear All
                </Button>
                <Button 
                  size="sm"
                  className="text-xs bg-sage-400 hover:bg-sage-500"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-full md:w-[180px] bg-white">
            <div className="flex items-center">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <span className="flex-1 text-left truncate">Sort</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchFilters;
