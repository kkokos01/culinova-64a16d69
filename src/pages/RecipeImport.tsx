import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, FileText, Link as LinkIcon, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from "@/components/Navbar";

const RecipeImport = () => {
  return (
    <div className="min-h-screen bg-cream-50/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Back Navigation */}
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-sage-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-display font-bold text-gray-900">Import a Recipe</h1>
          <p className="text-slate-600 mt-2">
            Add recipes from anywhere. We'll format them for you automatically.
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* Primary Action: Camera/Scan */}
          <Card className="border-dashed border-2 border-sage-200 bg-sage-50/30 hover:border-sage-400 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                <Camera className="h-10 w-10 text-sage-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Scan Menu or Cookbook</h3>
              <p className="text-slate-500 max-w-sm mb-6">
                Take a photo of a restaurant menu, a page from a cookbook, or a handwritten recipe card.
              </p>
              <Button size="lg" className="gap-2 bg-sage-600 hover:bg-sage-700 text-white">
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
            </CardContent>
          </Card>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-blue-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <LinkIcon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Paste URL</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-slate-500">
                Import directly from a food blog, YouTube video description, or recipe website.
              </CardContent>
            </Card>

            <Card className="hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-orange-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Paste Text</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-slate-500">
                Copy and paste raw text from an email, note, or message.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeImport;
