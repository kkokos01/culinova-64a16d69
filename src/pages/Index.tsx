
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  PlusCircle, 
  BookOpen, 
  Download, 
  Compass,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import ActivityRecipes from "@/components/ActivityRecipes";
import LatestActivityRecipes from "@/components/LatestActivityRecipes";
import RecentlyViewedRecipes from "@/components/RecentlyViewedRecipes";
import FeaturedRecipesCarousel from "@/components/recipes/FeaturedRecipesCarousel";
import QuickActionButtons from "@/components/home/QuickActionButtons";
import FloatingActionButton from "@/components/ui/floating-action-button";
import RecipeCard from "@/components/RecipeCard";
import { useAuth } from "@/context/AuthContext";
import { Recipe } from "@/types";
import { recipeService } from "@/services/supabase/recipeService";

const Index = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        // Load latest community recipes
        const community = await recipeService.getRecipes({ isPublic: true });
        setFeaturedRecipes(community.slice(0, 7));
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Get personalized greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const actions = [
    {
      title: "Create a New Recipe",
      description: "Start from scratch or use our AI Chef to generate a custom recipe based on your cravings.",
      icon: <PlusCircle className="h-8 w-8 text-sage-600" />,
      link: "/create",
      // Custom Palette: Sage Green Theme
      color: "bg-white border-sage-100 hover:border-sage-300 hover:bg-sage-50/50",
      iconBg: "bg-sage-100"
    },
    {
      title: "View My Recipes",
      description: "Access your personal cookbook, manage collections, and edit your saved dishes.",
      icon: <BookOpen className="h-8 w-8 text-blue-600" />, // Keeping Blue for 'Library' feel, or switch to Slate
      link: "/collections",
      // Custom Palette: Neutral/Slate Theme
      color: "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50",
      iconBg: "bg-slate-100"
    },
    {
      title: "Import a Recipe",
      description: "Scan a menu, paste a URL, or upload a photo to instantly capture a recipe.",
      icon: <Download className="h-8 w-8 text-terracotta-600" />,
      link: "/import",
      // Custom Palette: Terracotta Theme
      color: "bg-white border-terracotta-100 hover:border-terracotta-300 hover:bg-terracotta-50/50",
      iconBg: "bg-terracotta-100"
    },
    {
      title: "Get Inspired",
      description: "Browse Culinova's curated favorites and discover recipes shared by the community.",
      icon: <Compass className="h-8 w-8 text-orange-600" />, // Keeping Orange for 'Discovery'
      link: "/publiccollections", // CORRECTED ROUTE
      // Custom Palette: Warm Cream Theme
      color: "bg-white border-orange-100 hover:border-orange-300 hover:bg-orange-50/50",
      iconBg: "bg-orange-100"
    }
  ];

  return (
    <div className="min-h-screen bg-cream-50/30">
      <Navbar />
      
      {/* Hero Section - Simplified */}
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {getGreeting()}{user && `, ${user.user_metadata?.full_name || user.email?.split('@')[0]}`}. 
            <span className="text-sage-700"> What's cooking?</span>
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <QuickActionButtons 
          activeAction={activeFilter} 
          onActionChange={setActiveFilter} 
        />

        {/* Latest from the Community */}
        <div className="mt-10 mb-12">
          <FeaturedRecipesCarousel 
            recipes={featuredRecipes} 
            title="Latest from the Community"
          />
        </div>

        {/* Latest Activity from Your Collections */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
            Latest Activity from Your Collections
          </h2>
          <LatestActivityRecipes />
        </div>

        {/* Recently Viewed */}
        {user && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
              Recently Viewed
            </h2>
            <RecentlyViewedRecipes />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        to="/create"
        label="Create Recipe"
        className="md:bottom-6 md:right-6 bottom-20 right-6"
      />
    </div>
  );
};

export default Index;
