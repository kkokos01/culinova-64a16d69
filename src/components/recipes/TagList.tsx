
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagListProps {
  selectedTags: string[];
  handleTagToggle: (tag: string) => void;
  clearAllTags: () => void;
}

const TagList = ({ selectedTags, handleTagToggle, clearAllTags }: TagListProps) => {
  if (selectedTags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {selectedTags.map(tag => (
        <div 
          key={tag} 
          className="bg-sage-100 text-sage-700 px-3 py-1 rounded-full text-sm flex items-center"
        >
          {tag}
          <button
            onClick={() => handleTagToggle(tag)}
            className="ml-2 hover:text-sage-900"
            aria-label={`Remove ${tag} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {selectedTags.length > 1 && (
        <button
          onClick={clearAllTags}
          className="text-slate-500 hover:text-slate-700 text-sm underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default TagList;
