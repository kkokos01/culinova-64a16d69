
import React, { createContext, useContext, ReactNode } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";

export interface VersionContextType {
  recipeVersions: RecipeVersion[];
  activeVersionId: string;
  isLoadingVersions: boolean;
  fetchVersionsFromDb: (recipeId: string) => Promise<RecipeVersion[]>;
  addRecipeVersion: (name: string, recipe: Recipe) => Promise<RecipeVersion>;
  addTemporaryVersion: (name: string, recipe: Recipe) => RecipeVersion;
  persistVersion: (versionId: string) => Promise<RecipeVersion>;
  setActiveVersion: (versionId: string) => Promise<void>;
  renameVersion: (versionId: string, newName: string) => Promise<void>;
  deleteVersion: (versionId: string) => Promise<void>;
  hasInitializedVersions: boolean;
  setHasInitializedVersions: (initialized: boolean) => void;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export const VersionProvider: React.FC<{
  children: ReactNode;
  value: VersionContextType;
}> = ({ children, value }) => {
  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  );
};

export const useVersioning = (): VersionContextType => {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error("useVersioning must be used within a VersionProvider");
  }
  return context;
};
