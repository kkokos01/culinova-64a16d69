import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface HeroTextProps {
  className?: string;
}

const HeroText = ({ className }: HeroTextProps) => {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-cream-300/50 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#8BAA8B_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="animate-slide-in [animation-delay:100ms]">
            <span className="inline-block bg-sage-100 text-sage-600 px-3 py-1 rounded-full text-sm font-medium mb-6">
              A better way to cook
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-slate-800 mb-6 animate-slide-in [animation-delay:200ms]">
            Discover, Create, and Share<br />
            <span className="text-sage-500">Delicious Recipes</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl animate-slide-in [animation-delay:300ms]">
            Culinova helps you organize your recipes, plan your meals, and create shopping lists—all in one beautiful, intuitive app.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in [animation-delay:400ms]">
            <Button asChild size="lg" className="bg-sage-400 hover:bg-sage-500 text-white">
              <Link to="/collections">
                Browse Recipes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-sage-200 hover:bg-sage-50">
              <Link to="/recipes/create" className="flex items-center">
                Create Recipe <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroText;
