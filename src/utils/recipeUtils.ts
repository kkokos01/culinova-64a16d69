
import { Recipe } from "@/types";

export const filterRecipes = (
  recipes: Recipe[], 
  searchQuery: string,
  difficulty: string,
  timeFilter: string,
  selectedTags: string[],
  sortOption: string
): Recipe[] => {
  return recipes
    .filter(recipe => 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(recipe => {
      if (difficulty === "all") return true;
      return recipe.difficulty === difficulty;
    })
    .filter(recipe => {
      const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
      
      switch (timeFilter) {
        case "under15":
          return totalTime < 15;
        case "under30":
          return totalTime < 30;
        case "under60":
          return totalTime < 60;
        case "over60":
          return totalTime >= 60;
        default:
          return true;
      }
    })
    .filter(recipe => {
      if (selectedTags.length === 0) return true;
      return selectedTags.some(tag => recipe.tags?.includes(tag));
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "time_asc":
          return (a.prep_time_minutes + a.cook_time_minutes) - (b.prep_time_minutes + b.cook_time_minutes);
        case "time_desc":
          return (b.prep_time_minutes + b.cook_time_minutes) - (a.prep_time_minutes + a.cook_time_minutes);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
};
