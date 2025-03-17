
import React from "react";
import { Button } from "@/components/ui/button";

interface QuickModificationsSectionProps {
  onSelectModificationType: (type: string) => void;
  disabled?: boolean;
  selectedModifications: string[];
}

const QuickModificationsSection: React.FC<QuickModificationsSectionProps> = ({
  onSelectModificationType,
  disabled = false,
  selectedModifications
}) => {
  const modificationType = [
    { id: "healthier", label: "Healthier" },
    { id: "simpler", label: "Simpler" },
    { id: "vegan", label: "Vegan" },
    { id: "quicker", label: "Quicker" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "keto", label: "Keto" },
    { id: "spicier", label: "Spicier" },
    { id: "budget", label: "Budget" }
  ];

  const isSelected = (id: string) => selectedModifications.includes(id);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-white mb-2">Quick Modifications</h3>
      <div className="grid grid-cols-2 gap-2">
        {modificationType.map((type) => (
          <Button
            key={type.id}
            variant={isSelected(type.id) ? "default" : "outline"}
            onClick={() => onSelectModificationType(type.id)}
            disabled={disabled}
            className={isSelected(type.id) 
              ? "bg-sage-500 text-white hover:bg-sage-600" 
              : "border-white/30 text-white hover:bg-white/10"}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickModificationsSection;
