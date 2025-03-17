
import React, { useState } from "react";
import { RecipeVersion } from "@/context/recipe/types";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { useRecipe } from "@/context/recipe";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface VersionManagementProps {
  isActiveVersionTemporary: boolean;
  onSaveToDatabase: () => Promise<void>;
}

const VersionManagement: React.FC<VersionManagementProps> = ({
  isActiveVersionTemporary,
  onSaveToDatabase
}) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveToDatabase();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="mb-6">
      <RecipeVersionTabs />
      
      {isActiveVersionTemporary && (
        <Card className="mb-4">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <p className="text-sm text-amber-700">
              This version is temporary and will be lost if not saved
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save to Database
                </>
              )}
            </Button>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default VersionManagement;
