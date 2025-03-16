
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedRecipes from "@/components/FeaturedRecipes";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8 text-center">
        <Button asChild variant="default" className="mx-2">
          <Link to="/recipes">View All Recipes</Link>
        </Button>
        <Button asChild variant="outline" className="mx-2">
          <Link to="/supabase-recipes">View Supabase Recipes</Link>
        </Button>
      </div>
      <FeaturedRecipes />
    </div>
  );
};

export default Index;
