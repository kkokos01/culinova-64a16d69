
import Navbar from "@/components/Navbar";
import HeroText from "@/components/HeroText";
import HeroImage from "@/components/HeroImage";
import FeaturedRecipes from "@/components/FeaturedRecipes";
import ActivityRecipes from "@/components/ActivityRecipes";

const Index = () => {
  console.log("Rendering Index page");
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* 1. Hero Text Section */}
      <HeroText />
      
      {/* 2. Latest Activity from Your Collections */}
      <ActivityRecipes />
      
      {/* 3. Your Recipe History */}
      <FeaturedRecipes />
      
      {/* 4. Hero Image Section */}
      <HeroImage />
    </div>
  );
};

export default Index;
