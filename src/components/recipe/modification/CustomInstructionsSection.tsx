
import React from "react";

interface CustomInstructionsSectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CustomInstructionsSection: React.FC<CustomInstructionsSectionProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-white mb-2">Custom Instructions</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 px-3 py-2 rounded border border-white/30 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
        placeholder="Add custom instructions for modifying this recipe..."
        disabled={disabled}
      />
    </div>
  );
};

export default CustomInstructionsSection;
