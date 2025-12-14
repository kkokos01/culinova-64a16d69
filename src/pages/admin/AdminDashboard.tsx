import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Settings, 
  Eye, 
  Users, 
  ChefHat, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Space } from "@/types";
import RecipeStatusBadge from "@/components/recipe/RecipeStatusBadge";

interface PendingRecipeCount {
  space_id: string;
  space_name: string;
  pending_count: number;
  flagged_count: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { memberships, spaces, isLoading: spacesLoading } = useSpace();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pendingCounts, setPendingCounts] = useState<PendingRecipeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("spaces");

  // Filter to only spaces where user is admin
  const adminSpaces = spaces.filter(space => 
    memberships.some(m => m.space_id === space.id && m.role === 'admin' && m.is_active)
  );

  const isAdmin = adminSpaces.length > 0;

  const fetchPendingCounts = useCallback(async () => {
    try {
      setLoading(true);
      const pendingRecipes = await recipeService.getPendingApprovalRecipes();
      
      // Count recipes by space
      const counts: { [key: string]: { space_name: string; pending: number; flagged: number } } = {};
      
      adminSpaces.forEach(space => {
        counts[space.id] = { space_name: space.name || 'Unknown', pending: 0, flagged: 0 };
      });
      
      pendingRecipes.forEach(recipe => {
        if (recipe.space_id && counts[recipe.space_id]) {
          if (recipe.qa_status === 'pending') {
            counts[recipe.space_id].pending++;
          } else if (recipe.qa_status === 'flag') {
            counts[recipe.space_id].flagged++;
          }
        }
      });
      
      const countsArray = Object.entries(counts).map(([space_id, data]) => ({
        space_id,
        space_name: data.space_name,
        pending_count: data.pending,
        flagged_count: data.flagged
      }));
      
      setPendingCounts(countsArray);
    } catch (error: any) {
      console.error("Error fetching pending counts:", error);
      toast({
        title: "Error",
        description: "Failed to load pending recipe counts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [adminSpaces, toast]);

  useEffect(() => {
    if (!spacesLoading && (!user || adminSpaces.length === 0)) {
      navigate("/");
      return;
    }
    if (user && adminSpaces.length > 0) {
      fetchPendingCounts();
    }
  }, [user, adminSpaces.length, navigate, spacesLoading, fetchPendingCounts]);

  const handleReviewRecipes = (spaceId?: string) => {
    const url = spaceId ? `/admin/review?space=${spaceId}` : '/admin/review';
    navigate(url);
  };

  const handleManageSpace = (spaceId: string) => {
    navigate(`/collections?space=${spaceId}`);
  };

  const totalPending = pendingCounts.reduce((sum, count) => sum + count.pending_count + count.flagged_count, 0);

  if (spacesLoading || loading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need to be a space admin to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage your spaces and review recipes submitted for approval
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="spaces" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Space Management
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Recipe Approval
              {totalPending > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spaces" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSpaces.map((space) => {
                const count = pendingCounts.find(c => c.space_id === space.id);
                const totalForSpace = count ? count.pending_count + count.flagged_count : 0;
                
                return (
                  <Card key={space.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{space.name}</CardTitle>
                          <CardDescription>
                            Created {new Date(space.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {totalForSpace > 0 && (
                          <Badge variant="destructive">
                            {totalForSpace} pending
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            <span>Members: {space.member_count || 0}</span>
                          </div>
                          {space.description && (
                            <p className="line-clamp-2">{space.description}</p>
                          )}
                        </div>
                        
                        {totalForSpace > 0 && (
                          <div className="flex gap-2 text-sm">
                            {count?.pending_count > 0 && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {count.pending_count} pending
                              </Badge>
                            )}
                            {count?.flagged_count > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {count.flagged_count} flagged
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleManageSpace(space.id)}
                            className="flex-1"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                          {totalForSpace > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewRecipes(space.id)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            {totalPending === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-gray-500">No recipes are currently pending approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Pending Recipes ({totalPending})
                  </h3>
                  <Button onClick={() => handleReviewRecipes()}>
                    Review All Recipes
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingCounts.map((count) => {
                    if (count.pending_count + count.flagged_count === 0) return null;
                    
                    return (
                      <Card key={count.space_id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{count.space_name}</h4>
                              <div className="flex gap-2 mt-2">
                                {count.pending_count > 0 && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {count.pending_count} pending
                                  </Badge>
                                )}
                                {count.flagged_count > 0 && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {count.flagged_count} flagged
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleReviewRecipes(count.space_id)}
                            >
                              Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
