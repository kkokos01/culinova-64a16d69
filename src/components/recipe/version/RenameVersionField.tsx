
import React from "react";

interface RenameVersionFieldProps {
  newName: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const RenameVersionField: React.FC<RenameVersionFieldProps> = ({
  newName,
  onChange,
  onBlur,
  onKeyDown
}) => {
  return (
    <div className="flex items-center px-3 py-2">
      <input
        type="text"
        value={newName}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="border rounded px-2 py-1 text-sm w-[120px]"
        autoFocus
      />
    </div>
  );
};

export default RenameVersionField;
