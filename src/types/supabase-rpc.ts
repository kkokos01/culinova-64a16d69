
export interface RPCSearchFoods {
  search_query: string;
  space_id: string;
}

export interface RPCGetFoodDescendants {
  food_path: string;
}
