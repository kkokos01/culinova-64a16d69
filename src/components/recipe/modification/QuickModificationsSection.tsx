
import React from "react";
import { Button } from "@/components/ui/button";

interface QuickModificationsSectionProps {
  onSelectModificationType: (type: string) => void;
  disabled?: boolean;
}

const QuickModificationsSection: React.FC<QuickModificationsSectionProps> = ({
  onSelectModificationType,
  disabled = false
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

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-white mb-2">Quick Modifications</h3>
      <div className="grid grid-cols-2 gap-2">
        {modificationType.map((type) => (
          <Button
            key={type.id}
            variant="outline"
            onClick={() => onSelectModificationType(type.id)}
            disabled={disabled}
            className="border-white/30 text-white hover:bg-white/10"
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickModificationsSection;
