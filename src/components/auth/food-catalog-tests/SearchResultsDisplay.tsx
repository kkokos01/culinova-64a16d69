
import { Food } from "@/hooks/useFoodCatalogTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SearchResultsDisplayProps {
  searchResults: Food[];
  errorMessage?: string;
}

const SearchResultsDisplay = ({ searchResults, errorMessage }: SearchResultsDisplayProps) => {
  // Show error message if provided
  if (errorMessage) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Food Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Don't render anything if no results
  if (searchResults.length === 0) return null;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Food Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="font-medium">Found {searchResults.length} results</div>
          <div className="max-h-60 overflow-y-auto border rounded">
            {searchResults.map((food, index) => (
              <div 
                key={food.id} 
                className={`p-2 text-sm ${index % 2 === 0 ? 'bg-slate-50' : ''}`}
              >
                <div className="font-medium">{food.name}</div>
                <div className="text-xs text-slate-500">{food.description}</div>
                <div className="text-xs mt-1">
                  {food.tags && food.tags.map(tag => (
                    <span key={tag} className="inline-block bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResultsDisplay;
