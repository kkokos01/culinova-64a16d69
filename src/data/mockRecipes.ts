
import { Recipe } from "@/types";

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "1",
    user_id: "user1",
    title: "Creamy Garlic Herb Chicken",
    description: "A delicious creamy chicken dish with garlic and fresh herbs that's perfect for weeknight dinners.",
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    difficulty: "medium",
    is_public: true,
    privacy_level: "public",
    tags: ["chicken", "dinner", "creamy"],
    created_at: "2023-08-15T14:00:00Z",
    updated_at: "2023-08-15T14:00:00Z"
  },
  {
    id: "2",
    user_id: "user2",
    title: "Mediterranean Quinoa Salad",
    description: "A refreshing quinoa salad with cucumber, tomatoes, feta cheese, and olives in a lemon dressing.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 6,
    difficulty: "easy",
    is_public: true,
    privacy_level: "public",
    tags: ["vegetarian", "salad", "healthy"],
    created_at: "2023-08-12T10:30:00Z",
    updated_at: "2023-08-12T10:30:00Z"
  },
  {
    id: "3",
    user_id: "user3",
    title: "Spicy Thai Basil Noodles",
    description: "Spicy and aromatic Thai noodles with basil, vegetables and your choice of protein.",
    image_url: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8",
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    servings: 2,
    difficulty: "medium",
    is_public: true,
    privacy_level: "public",
    tags: ["asian", "spicy", "noodles"],
    created_at: "2023-08-10T18:15:00Z",
    updated_at: "2023-08-10T18:15:00Z"
  },
  {
    id: "4",
    user_id: "user1",
    title: "Classic Margherita Pizza",
    description: "A simple yet delicious pizza with fresh mozzarella, tomatoes, and basil on a thin crust.",
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    prep_time_minutes: 90,
    cook_time_minutes: 15,
    servings: 8,
    difficulty: "medium",
    is_public: true,
    privacy_level: "public",
    tags: ["italian", "pizza", "vegetarian"],
    created_at: "2023-08-05T19:45:00Z",
    updated_at: "2023-08-05T19:45:00Z"
  },
  {
    id: "5",
    user_id: "user2",
    title: "Chocolate Chip Cookies",
    description: "Soft and chewy chocolate chip cookies with a perfect balance of sweet and salty.",
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e",
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    servings: 24,
    difficulty: "easy",
    is_public: true,
    privacy_level: "public",
    tags: ["dessert", "baking", "cookies"],
    created_at: "2023-08-03T11:20:00Z",
    updated_at: "2023-08-03T11:20:00Z"
  },
  {
    id: "6",
    user_id: "user3",
    title: "Beef Bourguignon",
    description: "Classic French beef stew with red wine, bacon, and vegetables, slow-cooked to perfection.",
    image_url: "https://images.unsplash.com/photo-1534939561126-855b8675edd7",
    prep_time_minutes: 30,
    cook_time_minutes: 180,
    servings: 6,
    difficulty: "hard",
    is_public: true,
    privacy_level: "public",
    tags: ["french", "beef", "stew"],
    created_at: "2023-07-28T16:30:00Z",
    updated_at: "2023-07-28T16:30:00Z"
  },
  {
    id: "7",
    user_id: "user1",
    title: "Avocado Toast with Poached Egg",
    description: "Simple yet satisfying breakfast with creamy avocado and perfectly poached eggs on sourdough toast.",
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8",
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 2,
    difficulty: "easy",
    is_public: true,
    privacy_level: "public",
    tags: ["breakfast", "vegetarian", "quick"],
    created_at: "2023-07-25T09:15:00Z",
    updated_at: "2023-07-25T09:15:00Z"
  },
  {
    id: "8",
    user_id: "user2",
    title: "Sushi Rolls",
    description: "Homemade sushi rolls with fresh fish, crisp vegetables, and seasoned rice.",
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    prep_time_minutes: 45,
    cook_time_minutes: 30,
    servings: 4,
    difficulty: "hard",
    is_public: true,
    privacy_level: "public",
    tags: ["japanese", "seafood", "sushi"],
    created_at: "2023-07-20T17:40:00Z",
    updated_at: "2023-07-20T17:40:00Z"
  }
];
