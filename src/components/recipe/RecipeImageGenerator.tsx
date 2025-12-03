import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import { imageGenerator, ImageGenerationRequest, ImageGenerationResponse, ImageGenerationError } from '@/services/ai/imageGenerator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageIcon, Sparkles, RefreshCw, Camera } from 'lucide-react';

interface RecipeImageGeneratorProps {
  recipe: Recipe;
  onImageGenerated: (imageUrl: string) => void;
  currentImageUrl?: string;
}

const RecipeImageGenerator: React.FC<RecipeImageGeneratorProps> = ({
  recipe,
  onImageGenerated,
  currentImageUrl
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(currentImageUrl || null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [showPendingState, setShowPendingState] = useState(false);
  const { toast } = useToast();

  // Auto-generate image when recipe becomes available
  useEffect(() => {
    if (recipe && !generatedImageUrl && !isGenerating) {
      // Show pending state and start generation immediately
      setShowPendingState(true);
      handleGenerateImage('photorealistic');
    }
  }, [recipe?.id, recipe?.title, generatedImageUrl, isGenerating]);

  const handleGenerateImage = async (style: 'photorealistic' | 'artistic' | 'minimalist' = 'photorealistic') => {
    if (!recipe) return;

    setIsGenerating(true);
    setShowPendingState(false); // Hide pending state when generation starts
    
    try {
      const request: ImageGenerationRequest = {
        recipe,
        style,
        aspectRatio: '4:3' // Standard food photography format
      };

      const response = await imageGenerator.generateRecipeImage(request);

      // Handle success - new response format has imageUrl, prompt, style
      setGeneratedImageUrl(response.imageUrl);
      setLastPrompt(response.prompt);
      onImageGenerated(response.imageUrl);
      
      toast({
        title: "Image Generated Successfully!",
        description: "Your recipe image has been created using AI.",
        variant: "default",
      });

    } catch (error: any) {
      // Handle error - new format throws ImageGenerationError objects
      console.error('Error generating image:', error);
      
      toast({
        title: "Image Generation Failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = () => {
    handleGenerateImage('photorealistic');
  };

  const handleGenerateArtistic = () => {
    handleGenerateImage('artistic');
  };

  const handleGenerateMinimalist = () => {
    handleGenerateImage('minimalist');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Recipe Image
        </h3>
        {generatedImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateImage}
            disabled={isGenerating}
            className="text-sm"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        )}
      </div>

      {/* Image Display/Placeholder */}
      <div className="relative group">
        {generatedImageUrl ? (
          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200">
            <img
              src={generatedImageUrl}
              alt={`${recipe.title} - AI generated recipe image`}
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Generated
            </div>
          </div>
        ) : showPendingState ? (
          <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-64 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sage-50 to-sage-100 opacity-50"></div>
            <div className="relative text-center">
              <Loader2 className="h-12 w-12 text-sage-500 mx-auto mb-3 animate-spin" />
              <p className="text-sage-600 font-medium mb-1">Image Generation Pending</p>
              <p className="text-sage-500 text-sm">Creating your recipe image...</p>
            </div>
          </div>
        ) : (
          <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-64 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50"></div>
            <div className="relative text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No Recipe Image</p>
              <p className="text-gray-400 text-sm mb-4">Generate an AI image of your recipe</p>
            </div>
            
            {/* Generate Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
              <Button
                onClick={() => handleGenerateImage('photorealistic')}
                disabled={isGenerating}
                className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-2 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recipe Image
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Style Options (shown when no image or after generation) */}
      {!generatedImageUrl && !isGenerating && (
        <div className="mt-4 flex flex-wrap gap-2">
          <p className="text-sm text-gray-600 w-full mb-2">Choose image style:</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateImage('photorealistic')}
            className="text-xs"
          >
            📸 Photorealistic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateImage('artistic')}
            className="text-xs"
          >
            🎨 Artistic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateImage('minimalist')}
            className="text-xs"
          >
            ⚪ Minimalist
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <div className="text-sm">
            <p className="text-blue-900 font-medium">Generating your recipe image...</p>
            <p className="text-blue-700 text-xs">This may take 10-30 seconds</p>
          </div>
        </div>
      )}

      {/* Premium Feature Badge */}
      <div className="mt-3 flex items-center gap-2">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Premium Feature
        </div>
        <p className="text-xs text-gray-500">Powered by Google Imagen AI</p>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && lastPrompt && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer">Debug: Last Prompt</summary>
          <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded text-wrap break-words">
            {lastPrompt}
          </pre>
        </details>
      )}
    </div>
  );
};

export default RecipeImageGenerator;
