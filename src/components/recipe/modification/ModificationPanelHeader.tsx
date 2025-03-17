
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, Database } from "lucide-react";

interface ModificationPanelHeaderProps {
  onClose: () => void;
  isMobile: boolean;
  isTemporary?: boolean;
}

const ModificationPanelHeader: React.FC<ModificationPanelHeaderProps> = ({
  onClose,
  isMobile,
  isTemporary = false
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
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
          {isTemporary && (
            <Badge variant="outline" className="ml-2 px-2 py-1 bg-white/20 text-white border-white/30 flex items-center">
              <Database className="h-3 w-3 mr-1" />
              Temporary
            </Badge>
          )}
        </h2>
      </div>
    </div>
  );
};

export default ModificationPanelHeader;
