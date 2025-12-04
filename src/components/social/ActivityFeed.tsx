import React, { useState, useEffect } from 'react';
import { Activity } from '@/services/supabase/socialService';
import { socialService } from '@/services/supabase/socialService';
import { useSpace } from '@/context/SpaceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Copy, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
  className?: string;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  className = '', 
  limit = 10 
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentSpace } = useSpace();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!currentSpace?.id) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const feed = await socialService.getSpaceFeed(currentSpace.id, limit);
        setActivities(feed);
      } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [currentSpace?.id, limit]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentSpace?.id) return;

    const subscription = socialService.subscribeToSpaceActivity(
      currentSpace.id,
      (newActivity) => {
        setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentSpace?.id, limit]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'recipe_created':
        return <ChefHat className="h-4 w-4" />;
      case 'recipe_modified':
        return <Clock className="h-4 w-4" />;
      case 'recipe_forked':
        return <Copy className="h-4 w-4" />;
      case 'user_joined':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const actorName = activity.actor?.name || activity.actor?.email || 'Someone';
    const recipeTitle = activity.details?.title || 'a recipe';

    switch (activity.action_type) {
      case 'recipe_created':
        return `${actorName} created "${recipeTitle}"`;
      case 'recipe_modified':
        return `${actorName} modified "${recipeTitle}"`;
      case 'recipe_forked':
        const originalAuthor = activity.details?.original_author_name || 'someone';
        return `${actorName} saved "${recipeTitle}" by ${originalAuthor}`;
      case 'user_joined':
        return `${actorName} joined the space`;
      default:
        return `${actorName} performed an action`;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.entity_type === 'recipe' && activity.entity_id) {
      // Navigate to recipe detail
      window.location.href = `/recipes/${activity.entity_id}`;
    }
  };

  if (!currentSpace) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Select a space to see activity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
          <Badge variant="secondary" className="text-xs">
            {currentSpace.name}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Create or modify recipes to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`
                  flex items-start space-x-3 p-3 rounded-lg transition-colors
                  ${activity.entity_type === 'recipe' ? 'hover:bg-muted cursor-pointer' : ''}
                `}
                onClick={() => handleActivityClick(activity)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={activity.actor?.avatar_url} 
                    alt={activity.actor?.name || activity.actor?.email} 
                  />
                  <AvatarFallback className="text-xs">
                    {activity.actor?.name?.charAt(0) || 
                     activity.actor?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getActivityIcon(activity.action_type)}
                    <p className="text-sm font-medium truncate">
                      {getActivityText(activity)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
