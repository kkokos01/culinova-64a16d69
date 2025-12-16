import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types';
import RecipeCard from '@/components/RecipeCard';
import { cn } from '@/lib/utils';

interface FeaturedRecipesCarouselProps {
  recipes: Recipe[];
  title?: string;
}

const FeaturedRecipesCarousel = ({ recipes, title = "Featured Recipes" }: FeaturedRecipesCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((api: any) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-semibold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-opacity",
              !canScrollPrev && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-opacity",
              !canScrollNext && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex-[0_0_auto] w-[280px] sm:w-[320px] md:w-[340px]"
            >
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedRecipesCarousel;
