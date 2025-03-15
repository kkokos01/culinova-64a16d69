
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";

const RecipeDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-full mb-4" />
          
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />
          
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={`ing-${i}`} className="h-6 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={`step-${i}`} className="flex">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailSkeleton;
