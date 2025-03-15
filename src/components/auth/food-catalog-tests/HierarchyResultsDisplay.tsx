
import { Food } from "@/hooks/useFoodCatalogTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HierarchyResultsDisplayProps {
  ancestors: Food[];
  descendants: Food[];
}

const HierarchyResultsDisplay = ({ ancestors, descendants }: HierarchyResultsDisplayProps) => {
  if (ancestors.length === 0 && descendants.length === 0) return null;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Hierarchy Results</CardTitle>
      </CardHeader>
      <CardContent>
        {ancestors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Ancestors</h4>
            <div className="max-h-40 overflow-y-auto border rounded">
              {ancestors.map((food, index) => (
                <div 
                  key={food.id} 
                  className={`p-2 text-sm ${index % 2 === 0 ? 'bg-slate-50' : ''}`}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-xs">Path: {food.path}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {descendants.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Descendants</h4>
            <div className="max-h-40 overflow-y-auto border rounded">
              {descendants.map((food, index) => (
                <div 
                  key={food.id} 
                  className={`p-2 text-sm ${index % 2 === 0 ? 'bg-slate-50' : ''}`}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-xs">Path: {food.path}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HierarchyResultsDisplay;
