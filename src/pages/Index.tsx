
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedRecipes from "@/components/FeaturedRecipes";

const Index = () => {
  console.log("Rendering Index page");
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeaturedRecipes />
    </div>
  );
};

export default Index;
