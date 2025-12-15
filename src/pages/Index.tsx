
import React from "react";
import { Link } from "react-router-dom";
import { 
  PlusCircle, 
  BookOpen, 
  Download, 
  Compass,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import ActivityRecipes from "@/components/ActivityRecipes"; // Keeping existing engagement loop
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();
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
      
      {/* Hero / Command Center Section */}
      <div className="container mx-auto px-4 pt-16 pb-12 max-w-5xl">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-gray-900">
            Welcome to <span className="text-sage-700">Culinova</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-sans">
            Your intelligent culinary workspace. Manage your kitchen, plan your meals, and cook with confidence.
          </p>
        </div>

        {/* The 2x2 Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {actions.map((action, index) => (
            <Link key={index} to={action.link} className="block group h-full">
              <Card className={`h-full transition-all duration-300 border shadow-sm hover:shadow-md ${action.color}`}>
                <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                  <div className={`p-3 rounded-xl ${action.iconBg} transition-transform group-hover:scale-105`}>
                    {action.icon}
                  </div>
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
                      {action.title}
                      <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-400" />
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed ml-[4rem]">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Hybrid Section: Keep Recent Activity so the page isn't "dead" - Only show for authenticated users */}
        {user && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-semibold text-gray-900">
              Recent Activity
            </h2>
            <ActivityRecipes />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
