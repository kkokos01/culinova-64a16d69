import { Card, CardContent, CardFooter } from "@/components/ui/card";

const SkeletonCard = () => {
  return (
    <Card className="overflow-hidden h-full bg-white shadow-sm">
      {/* Skeleton image */}
      <div className="aspect-video relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer"></div>
        {/* Simulated tag placeholders */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Skeleton content */}
      <CardContent className="px-4 pt-4 pb-3">
        <div className="space-y-3">
          <div className="h-7 bg-slate-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
      
      {/* Skeleton footer */}
      <CardFooter className="flex justify-between items-center pt-0 px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  );
};

export default SkeletonCard;
