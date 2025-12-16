import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  BookOpen, 
  User,
  ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const BottomTabNavigation = () => {
  const location = useLocation();

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      path: '/'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-5 w-5" />,
      path: '/search'
    },
    {
      id: 'pantry',
      label: 'Pantry',
      icon: <ChefHat className="h-5 w-5" />,
      path: '/profile?tab=pantry'
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/collections'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      path: '/profile'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    if (path.includes('?') && location.pathname === path.split('?')[0]) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200",
              "relative group",
              isActive(tab.path)
                ? "text-sage-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              {tab.icon}
              {isActive(tab.path) && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sage-600 rounded-full" />
              )}
            </div>
            <span className="text-xs mt-1 font-medium">
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomTabNavigation;
