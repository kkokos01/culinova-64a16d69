
import React, { useEffect, useState } from 'react';
import { useDebugSupabaseData } from '@/utils/debugSupabaseData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

// Quick diagnostic component to check database vs. frontend data
const RecipeDatabaseDiagnostic = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { inspectRecipe, findTikkaMasalaRecipe } = useDebugSupabaseData();
  const [currentRecipeData, setCurrentRecipeData] = useState<any>(null);
  const [tikkaMasalaData, setTikkaMasalaData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const checkCurrentRecipe = async () => {
    setIsLoading(true);
    try {
      if (!id) {
        toast({ 
          title: "Error", 
          description: "No recipe ID available", 
          variant: "destructive" 
        });
        return;
      }
      
      const data = await inspectRecipe(id);
      setCurrentRecipeData(data);
      
      toast({ 
        title: "Recipe Checked", 
        description: "Current recipe data retrieved from database" 
      });
    } catch (error) {
      console.error("Error checking recipe:", error);
      toast({ 
        title: "Error", 
        description: "Failed to check recipe data", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkTikkaMasalaRecipe = async () => {
    setIsLoading(true);
    try {
      const data = await findTikkaMasalaRecipe();
      setTikkaMasalaData(data);
      
      if (data) {
        toast({ 
          title: "Recipe Found", 
          description: "Tikka Masala recipe found in database" 
        });
      } else {
        toast({ 
          title: "Recipe Not Found", 
          description: "No Tikka Masala recipe found in database", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error finding Tikka Masala:", error);
      toast({ 
        title: "Error", 
        description: "Failed to find Tikka Masala recipe", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showDiagnostic) {
    return (
      <div className="flex justify-center mt-4">
        <Button 
          onClick={() => setShowDiagnostic(true)}
          variant="outline" 
          size="sm"
        >
          Show Database Diagnostic
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-8 border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-800 flex justify-between items-center">
          <span>Database Diagnostic</span>
          <Button 
            onClick={() => setShowDiagnostic(false)} 
            variant="ghost" 
            size="sm"
            className="text-amber-800 hover:text-amber-950 hover:bg-amber-100"
          >
            Hide
          </Button>
        </CardTitle>
        <CardDescription className="text-amber-700">
          Check recipe data in the database vs. what's displayed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={checkCurrentRecipe}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Check Current Recipe (ID: {id?.substring(0, 8)}...)
            </Button>
            <Button
              onClick={checkTikkaMasalaRecipe}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Find Tikka Masala Recipe
            </Button>
          </div>

          {isLoading && (
            <div className="text-amber-700">Loading data...</div>
          )}

          {currentRecipeData && (
            <div>
              <h3 className="font-medium text-amber-800">Current Recipe Data:</h3>
              <ScrollArea className="h-[200px] rounded border border-amber-200 p-4 bg-white">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(currentRecipeData, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

          {tikkaMasalaData && (
            <div>
              <h3 className="font-medium text-amber-800 mt-4">Tikka Masala Recipe Found:</h3>
              <ScrollArea className="h-[200px] rounded border border-amber-200 p-4 bg-white">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(tikkaMasalaData, null, 2)}
                </pre>
              </ScrollArea>
              
              {tikkaMasalaData.recipe && (
                <div className="mt-4 p-4 border border-amber-200 rounded bg-white">
                  <p className="font-medium text-amber-800">Recipe ID: {tikkaMasalaData.recipe.id}</p>
                  <p className="text-amber-700">Title: {tikkaMasalaData.recipe.title}</p>
                  <p className="text-amber-700">Created: {new Date(tikkaMasalaData.recipe.created_at).toLocaleString()}</p>
                  
                  {tikkaMasalaData.details?.ingredients && (
                    <div className="mt-2">
                      <p className="font-medium text-amber-800">Ingredients:</p>
                      <ul className="list-disc pl-5 text-amber-700">
                        {tikkaMasalaData.details.ingredients.map((ing: any) => (
                          <li key={ing.id}>
                            {ing.amount} {ing.unit?.abbreviation} {ing.food?.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeDatabaseDiagnostic;
