
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedRecipes from "@/components/FeaturedRecipes";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    console.log("Index page mounted");
    return () => {
      console.log("Index page unmounted");
    };
  }, []);

  console.log("Rendering Index page");
  
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
