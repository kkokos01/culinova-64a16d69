import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import { aiRecipeGenerator } from '@/services/ai/recipeGenerator';
import { useToast } from "@/components/ui/use-toast";

const RecipeImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");

  const handleImport = async (type: 'text' | 'url') => {
    const content = type === 'url' ? urlInput : textInput;
    if (!content.trim()) {
      toast({ title: "Empty Input", description: "Please enter text or a URL.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiRecipeGenerator.importRecipe(type, content);
      
      if ('type' in result && result.type === 'service_error') {
        throw new Error(result.message);
      }

      // Success! Navigate to Create page with the data
      navigate('/create', { state: { initialRecipe: result, mode: 'import' } });
      
    } catch (error) {
      toast({ 
        title: "Import Failed", 
        description: error instanceof Error ? error.message : "Could not parse recipe.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-cream-50/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Back Navigation */}
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-sage-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-display font-bold text-gray-900">Import a Recipe</h1>
          <p className="text-slate-600 mt-2">
            Add recipes from anywhere. We'll format them for you automatically.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center font-display">Import Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipe URL</label>
                  <Input
                    placeholder="https://www.foodblog.com/recipe-name"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Import from any food blog, recipe website, or YouTube description.
                  </p>
                </div>
                <Button 
                  onClick={() => handleImport('url')} 
                  disabled={isLoading || !urlInput.trim()}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                  Import from URL
                </Button>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipe Text</label>
                  <Textarea
                    placeholder="Paste the recipe ingredients and instructions here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isLoading}
                    rows={8}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Copy and paste from an email, note, message, or document.
                  </p>
                </div>
                <Button 
                  onClick={() => handleImport('text')} 
                  disabled={isLoading || !textInput.trim()}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Import from Text
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecipeImport;
