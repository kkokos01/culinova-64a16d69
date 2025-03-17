
import React, { createContext, useContext, ReactNode } from "react";
import { Ingredient } from "@/types";

export interface ModificationContextType {
  selectedIngredient: Ingredient | null;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  selectIngredientForModification: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  removeIngredientSelection: (id: string) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  isAiModifying: boolean;
  handleStartModification: (modificationType: string) => void;
}

const ModificationContext = createContext<ModificationContextType | undefined>(undefined);

export const ModificationProvider: React.FC<{
  children: ReactNode;
  value: ModificationContextType;
}> = ({ children, value }) => {
  return (
    <ModificationContext.Provider value={value}>
      {children}
    </ModificationContext.Provider>
  );
};

export const useModification = (): ModificationContextType => {
  const context = useContext(ModificationContext);
  if (context === undefined) {
    throw new Error("useModification must be used within a ModificationProvider");
  }
  return context;
};
