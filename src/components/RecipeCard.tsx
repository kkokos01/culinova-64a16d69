
import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Recipe } from "@/types";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

const RecipeCard = ({ recipe, className }: RecipeCardProps) => {
  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  
  // Format time to display in hours and minutes if needed
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  };
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <Link to={`/recipes/${recipe.id}`}>
      <Card className={cn("overflow-hidden h-full recipe-card", className)}>
        {/* Image with gradient overlay */}
        <div className="aspect-video relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img 
            src={recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} 
            alt={recipe.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Tags overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getDifficultyColor(recipe.difficulty)
            )}>
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </span>
            
            {recipe.tags && recipe.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="bg-white/80 backdrop-blur-sm text-slate-800 px-2 py-1 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium text-slate-800 line-clamp-2 mb-2">
            {recipe.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {recipe.description}
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center text-sm text-slate-500 pt-0">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formatTime(totalTime)}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default RecipeCard;
