import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { socialService } from "@/services/supabase/socialService";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  UserPlus, 
  Globe, 
  ArrowLeft,
  PlusCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicSpaceCreator } from "@/components/auth/PublicSpaceCreator";

const PublicCollections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch public spaces for browsing
  const { data: publicSpaces = [], isLoading: publicLoading } = useQuery({
    queryKey: ['publicSpaces', publicSearchQuery, sortBy],
    queryFn: async () => {
      try {
        const allPublicSpaces = await socialService.getPublicSpaces();
        
        // Filter by search query
        let filtered = allPublicSpaces;
        if (publicSearchQuery.trim()) {
          filtered = allPublicSpaces.filter(space => 
            space.name.toLowerCase().includes(publicSearchQuery.toLowerCase()) ||
            (space.description && space.description.toLowerCase().includes(publicSearchQuery.toLowerCase()))
          );
        }
        
        // Sort by selected criteria
        const sorted = [...filtered].sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'members':
              return (b.member_count || 0) - (a.member_count || 0);
            case 'recipes':
              return (b.recipe_count || 0) - (a.recipe_count || 0);
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
        
        return sorted;
      } catch (err) {
        console.error('Error fetching public spaces:', err);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000,
  });

  // Join a public space
  const handleJoinSpace = async (spaceId: string, spaceName: string) => {
    try {
      // TODO: Implement join space functionality in socialService
      toast({
        title: "Join Collection",
        description: `Attempting to join "${spaceName}"...`,
      });
      // const success = await socialService.joinSpace(spaceId, user.id);
      // if (success) {
      //   toast({
      //     title: "Collection joined",
      //     description: `You've successfully joined "${spaceName}"`,
      //   });
      //   navigate("/collections");
      // }
    } catch (error) {
      toast({
        title: "Error joining collection",
        description: "Failed to join collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/collections")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Collections
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Public Collections</h1>
              <p className="text-gray-600">
                Discover and join public collections from the Culinova community
              </p>
            </div>
            
            <PublicSpaceCreator>
              <Button 
                className="bg-sage-400 hover:bg-sage-500 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
            </PublicSpaceCreator>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search public collections..."
              value={publicSearchQuery}
              onChange={(e) => setPublicSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="members">Most Members</SelectItem>
              <SelectItem value="recipes">Most Recipes</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Public Collections Grid */}
        {publicLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : publicSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicSpaces.map((collection) => (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-sage-500" />
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {collection.member_count || 1}
                    </Badge>
                  </div>
                  <CardDescription>
                    {collection.description || "A public collection for collaborative cooking"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {collection.recipe_count || 0} recipes
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/collections?space=${collection.id}`)}
                      >
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleJoinSpace(collection.id, collection.name)}
                        className="bg-sage-400 hover:bg-sage-500 text-white"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sage-50 rounded-lg border border-sage-200">
            <Globe className="h-12 w-12 text-sage-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {publicSearchQuery ? "No Collections Found" : "No Public Collections Yet"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {publicSearchQuery 
                ? "Try adjusting your search terms to find public collections."
                : "Be the first to create a public collection and share your recipes with the community!"
              }
            </p>
            <PublicSpaceCreator>
              <Button 
                className="bg-sage-400 hover:bg-sage-500 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Public Collection
              </Button>
            </PublicSpaceCreator>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCollections;
