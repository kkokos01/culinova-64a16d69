
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, Search, User, ShoppingCart, Calendar, LogOut, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  
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
    { path: '/recipes', label: 'Recipes' },
    { path: '/shopping-lists', label: 'Shopping Lists' },
    { path: '/meal-plans', label: 'Meal Plans' }
  ];
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2 font-display font-medium text-xl text-sage-600 transition-opacity hover:opacity-80"
        >
          <ChefHat className="h-6 w-6 text-sage-500" />
          <span>Culinova</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-sage-600 focus-ring rounded-md px-2 py-1",
                isActive(link.path) 
                  ? "text-sage-600 font-semibold" 
                  : "text-slate-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 hover:text-sage-600 hover:bg-sage-100"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 hover:text-sage-600 hover:bg-sage-100"
            aria-label="Shopping Lists"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 hover:text-sage-600 hover:bg-sage-100"
            aria-label="Meal Plans"
          >
            <Calendar className="h-5 w-5" />
          </Button>
          
          {user && (
            <Button 
              variant="ghost"
              size="icon" 
              className="text-slate-600 hover:text-sage-600 hover:bg-sage-100"
              aria-label="Database Test"
              asChild
            >
              <Link to="/auth/test">
                <Database className="h-5 w-5" />
              </Link>
            </Button>
          )}
          
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
                <DropdownMenuItem asChild>
                  <Link to="/auth/test">
                    <Database className="mr-2 h-4 w-4" />
                    <span>Database Test</span>
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
              <Link to="/create-recipe">Create Recipe</Link>
            </Button>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-700" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-white z-40 flex flex-col pt-16 transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col px-6 py-8 space-y-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-lg font-medium transition-colors hover:text-sage-600 focus:outline-none focus:text-sage-600",
                isActive(link.path) 
                  ? "text-sage-600 font-semibold" 
                  : "text-slate-700"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-200 flex flex-col space-y-4">
            <Link 
              to="/search" 
              className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </Link>
            <Link 
              to="/shopping-lists" 
              className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Shopping Lists</span>
            </Link>
            <Link 
              to="/meal-plans" 
              className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
            >
              <Calendar className="h-5 w-5" />
              <span>Meal Plans</span>
            </Link>
            
            {user && (
              <Link 
                to="/auth/test" 
                className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
              >
                <Database className="h-5 w-5" />
                <span>Database Test</span>
              </Link>
            )}
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <Link 
                to="/sign-in" 
                className="flex items-center space-x-2 text-slate-700 hover:text-sage-600"
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
              <Link to="/create-recipe">Create Recipe</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
