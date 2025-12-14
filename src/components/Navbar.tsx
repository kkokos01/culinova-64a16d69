
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, Search, User, LogOut, ShoppingCart, FolderOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSpace } from '@/context/SpaceContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { recipeService } from '@/services/supabase/recipeService';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { memberships, spaces } = useSpace();
  
  // Check if user is admin of any space
  const isAdmin = spaces.some(space => 
    memberships.some(m => m.space_id === space.id && m.role === 'admin' && m.is_active)
  );
  
  // Fetch pending recipe count for admins
  useEffect(() => {
    if (isAdmin && user) {
      const fetchPendingCount = async () => {
        try {
          const pendingRecipes = await recipeService.getPendingApprovalRecipes();
          // Filter to only spaces where user is admin
          const adminSpaceIds = spaces
            .filter(space => memberships.some(m => m.space_id === space.id && m.role === 'admin' && m.is_active))
            .map(s => s.id);
          
          const count = pendingRecipes.filter(r => 
            r.space_id && adminSpaceIds.includes(r.space_id)
          ).length;
          
          setPendingCount(count);
        } catch (error) {
          console.error('Error fetching pending count:', error);
        }
      };
      
      fetchPendingCount();
    }
  }, [isAdmin, user, spaces, memberships]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/collections', label: 'Collections', isDropdown: true },
    { path: '/profile?tab=pantry', label: 'Pantry' },
    { path: '/shopping-list', label: 'Shopping List', icon: ShoppingCart },
    // Shopping Lists and Meal Plans removed as requested
  ];
  
  // Admin link - only shown if user is admin of any space
  const adminLink = {
    path: '/admin/dashboard',
    label: 'Admin',
    icon: Settings,
    badge: pendingCount
  };
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-slate-800 shadow-md" : "bg-slate-800"
      )}
    >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2 font-display font-medium text-xl text-white transition-opacity hover:opacity-80"
        >
          <ChefHat className="h-6 w-6 text-sage-400" />
          <span>Culinova</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            link.isDropdown ? (
              <DropdownMenu key={link.path}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-sage-400 focus-ring rounded-md px-2 py-1 flex items-center gap-1",
                      isActive(link.path) 
                        ? "text-sage-400 font-semibold" 
                        : "text-white"
                    )}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {link.label}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/collections" className="flex items-center">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>My Collections</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publiccollections" className="flex items-center">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>Public Collections</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-sage-400 focus-ring rounded-md px-2 py-1 flex items-center gap-1",
                  isActive(link.path) 
                    ? "text-sage-400 font-semibold" 
                    : "text-white"
                )}
              >
                {link.icon && <link.icon className="h-4 w-4 mr-1" />}
                {link.label}
              </Link>
            )
          ))}
          
          {/* Admin link - only shown if user is admin */}
          {isAdmin && (
            <Link
              to={adminLink.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-sage-400 focus-ring rounded-md px-2 py-1 flex items-center gap-1",
                isActive(adminLink.path) 
                  ? "text-sage-400 font-semibold" 
                  : "text-white"
              )}
            >
              <adminLink.icon className="h-4 w-4" />
              {adminLink.label}
              {adminLink.badge > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {adminLink.badge}
                </Badge>
              )}
            </Link>
          )}
        </nav>
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 p-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              asChild
              className="bg-sage-400 hover:bg-sage-500 text-white"
            >
              <Link to="/sign-in">Sign In</Link>
            </Button>
          )}
          
          {user && (
            <Button 
              className="bg-sage-400 hover:bg-sage-500 text-white"
              asChild
            >
              <Link to="/recipes/create">Create Recipe</Link>
            </Button>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-800 z-40 flex flex-col pt-16 transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col px-6 py-8 space-y-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-lg font-medium transition-colors hover:text-sage-400 flex items-center gap-2",
                isActive(link.path) ? "text-sage-400 font-semibold" : "text-white"
              )}
            >
              {link.icon && <link.icon className="h-5 w-5" />}
              {link.label}
            </Link>
          ))}
          
          {/* Admin link in mobile menu */}
          {isAdmin && (
            <Link
              to={adminLink.path}
              className={cn(
                "text-lg font-medium transition-colors hover:text-sage-400 flex items-center gap-2",
                isActive(adminLink.path) ? "text-sage-400 font-semibold" : "text-white"
              )}
            >
              <adminLink.icon className="h-5 w-5" />
              {adminLink.label}
              {adminLink.badge > 0 && (
                <Badge variant="destructive" className="h-6 px-2 text-sm">
                  {adminLink.badge}
                </Badge>
              )}
            </Link>
          )}
          <div className="pt-4 border-t border-slate-700 flex flex-col space-y-4">
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-white hover:text-sage-400"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 text-white hover:text-sage-400"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <Link 
                to="/sign-in" 
                className="flex items-center space-x-2 text-white hover:text-sage-400"
              >
                <User className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
          
          {user && (
            <Button 
              className="mt-6 bg-sage-400 hover:bg-sage-500 text-white w-full"
              asChild
            >
              <Link to="/recipes/create">Create Recipe</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
