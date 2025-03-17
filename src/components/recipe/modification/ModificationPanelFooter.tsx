
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save, Loader2, Wand2 } from "lucide-react";

interface ModificationPanelFooterProps {
  isModified: boolean;
  onReset: () => void;
  onSave: () => void;
  onStartModification: () => void;
  isSaving?: boolean;
  isAiModifying?: boolean;
  canModify: boolean;
}

const ModificationPanelFooter: React.FC<ModificationPanelFooterProps> = ({
  isModified,
  onReset,
  onSave,
  onStartModification,
  isSaving = false,
  isAiModifying = false,
  canModify
}) => {
  if (isModified) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="text-white border-white/30 hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Original
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || isAiModifying}
          className="bg-white text-sage-600 hover:bg-white/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Modifications
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onStartModification}
      disabled={!canModify || isAiModifying}
      className="w-full bg-white text-sage-600 hover:bg-white/90"
    >
      {isAiModifying ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Modifying Recipe...
        </>
      ) : (
        <>
          <Wand2 className="h-4 w-4 mr-2" />
          Modify Recipe with AI
        </>
      )}
    </Button>
  );
};

export default ModificationPanelFooter;
