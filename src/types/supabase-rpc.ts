
export interface RPCSearchFoods {
  search_query: string;
  space_id: string;
}

export interface RPCGetFoodDescendants {
  food_path: string;
}

export interface RPCGetFoodAncestors {
  food_path: string;
}
