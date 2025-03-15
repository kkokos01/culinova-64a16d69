
import { Food } from "@/hooks/useFoodCatalogTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FoodDetailsDisplayProps {
  title: string;
  food: Food | null;
}

const FoodDetailsDisplay = ({ title, food }: FoodDetailsDisplayProps) => {
  if (!food) return null;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {food.name}
          </div>
          <div>
            <span className="font-medium">Description:</span> {food.description}
          </div>
          <div>
            <span className="font-medium">Path:</span> {food.path}
          </div>
          {food.category_id && (
            <div>
              <span className="font-medium">Category ID:</span> {food.category_id}
            </div>
          )}
          {food.tags && food.tags.length > 0 && (
            <div>
              <span className="font-medium">Tags:</span>{" "}
              {food.tags.map(tag => (
                <span key={tag} className="inline-block bg-slate-100 px-2 py-1 rounded text-xs mr-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {food.properties && Object.keys(food.properties).length > 0 && (
            <div>
              <span className="font-medium">Properties:</span>
              <pre className="text-xs bg-slate-50 p-2 rounded mt-1">
                {JSON.stringify(food.properties, null, 2)}
              </pre>
            </div>
          )}
          {food.inheritable_properties && Object.keys(food.inheritable_properties).length > 0 && (
            <div>
              <span className="font-medium">Inheritable Properties:</span>
              <pre className="text-xs bg-slate-50 p-2 rounded mt-1">
                {JSON.stringify(food.inheritable_properties, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodDetailsDisplay;
