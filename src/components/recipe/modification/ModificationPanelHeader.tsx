
import React from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";

interface ModificationPanelHeaderProps {
  onClose: () => void;
  isMobile: boolean;
}

const ModificationPanelHeader: React.FC<ModificationPanelHeaderProps> = ({
  onClose,
  isMobile
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/20">
      <div className="flex items-center">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-2 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-2 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-xl font-bold text-white">
          Modify Recipe
        </h2>
      </div>
    </div>
  );
};

export default ModificationPanelHeader;
