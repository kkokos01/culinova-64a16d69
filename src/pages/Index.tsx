
import Hero from "@/components/Hero";
import FeaturedRecipes from "@/components/FeaturedRecipes";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16"> {/* Add padding top to account for fixed navbar */}
        <Hero />
        
        {/* Auth Testing Section */}
        <div className="container mx-auto my-8 p-6 bg-sage-50 rounded-lg">
          <h2 className="text-2xl font-display font-semibold text-sage-700 mb-4">
            Testing Authentication
          </h2>
          <p className="mb-4 text-slate-600">
            You can test the authentication flow by using these links:
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="default" className="bg-sage-500 hover:bg-sage-600">
              <Link to="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/sign-up">Sign Up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile">Profile (Protected)</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Note: Without a real Supabase connection, authentication will appear to work in the UI but won't actually authenticate.
          </p>
        </div>
        
        <FeaturedRecipes />
        
        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 bg-cream-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-semibold text-slate-800 mb-4">
              Everything you need to cook with confidence
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Culinova brings all your cooking needs together in one beautiful, intuitive platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md animate-slide-in">
              <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                Recipe Management
              </h3>
              <p className="text-slate-600">
                Create, organize, and search through your personal recipe collection with ease. Add photos, notes, and customize to your heart's content.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md animate-slide-in [animation-delay:100ms]">
              <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                Shopping Lists
              </h3>
              <p className="text-slate-600">
                Generate shopping lists from your recipes with a single click. Organize by aisle, check off items as you shop, and never forget an ingredient again.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md animate-slide-in [animation-delay:200ms]">
              <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                Meal Planning
              </h3>
              <p className="text-slate-600">
                Plan your meals for the week or month ahead. Save time, reduce food waste, and take the stress out of deciding what to cook.
              </p>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-sage-500 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-semibold mb-6">
              Ready to transform your cooking experience?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-white/90">
              Join thousands of home cooks who are already using Culinova to simplify their kitchen life.
            </p>
            <button className="bg-white text-sage-600 hover:bg-cream-100 px-6 py-3 rounded-lg font-medium transition-colors duration-300">
              Get Started Free
            </button>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-display font-medium text-lg mb-4">Culinova</h3>
                <p className="text-slate-300 text-sm">
                  A better way to manage recipes, plan meals, and create shopping lists.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Features</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><a href="#" className="hover:text-white">Recipe Management</a></li>
                  <li><a href="#" className="hover:text-white">Shopping Lists</a></li>
                  <li><a href="#" className="hover:text-white">Meal Planning</a></li>
                  <li><a href="#" className="hover:text-white">Ingredient Substitutions</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                  <li><a href="#" className="hover:text-white">Cooking Tips</a></li>
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-slate-400">
                &copy; {new Date().getFullYear()} Culinova. All rights reserved.
              </p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a href="#" className="text-slate-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
