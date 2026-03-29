import { ChatRecipeSuggestion, FridgeItem } from "../types/contracts";

export const categoryAccent: Record<string, string> = {
  Vegetable: "#DDF5E8",
  Fruit: "#FFE5C8",
  Protein: "#FDE2DD",
  Dairy: "#FFF0BE",
  Pantry: "#E7EDFF",
  Seasoning: "#F8E2FF",
  Other: "#EFE9E0",
};

export function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getRecipeSteps(suggestion: ChatRecipeSuggestion) {
  const cleanedSteps = suggestion.steps?.map((step) => step.trim()).filter(Boolean) ?? [];
  if (cleanedSteps.length > 0) {
    return cleanedSteps;
  }

  const ingredients = suggestion.ingredients.length > 0 ? suggestion.ingredients : ["your main ingredients"];
  const joinedIngredients = ingredients.slice(0, 4).join(", ");
  const title = suggestion.title.toLowerCase();

  if (title.includes("salad")) {
    return [
      `Prep ${joinedIngredients} into bite-size pieces and season lightly.`,
      "Build the base of the salad first, then add protein, herbs, or crunch.",
      "Dress the salad right before serving so the texture stays fresh.",
      "Taste once more and finish with acid, pepper, or flaky salt if needed.",
    ];
  }

  if (title.includes("soup") || title.includes("broth")) {
    return [
      `Start by softening the core ingredients like ${joinedIngredients} in a little oil.`,
      "Add broth or water, season well, and simmer until the flavors settle.",
      "Drop in fast-cooking ingredients near the end so they stay bright.",
      "Taste, adjust, and serve hot with herbs, citrus, or chili on top.",
    ];
  }

  if (title.includes("toast")) {
    return [
      "Toast the bread until golden and sturdy enough to hold toppings.",
      `Cook or warm the key ingredients like ${joinedIngredients}.`,
      "Layer everything onto the toast while it is still warm and season assertively.",
      "Finish with something sharp or fresh, then serve immediately.",
    ];
  }

  return [
    `Prep the main ingredients first so ${joinedIngredients} are ready to move once the heat is on.`,
    "Start cooking the ingredients that need the most time, then add the delicate ones later.",
    "Season in layers and add sauce, stock, or cheese only after the base tastes good.",
    "Taste, adjust, and plate while the texture still feels lively and fresh.",
  ];
}

export function buildQuickRecipeIdeas(items: FridgeItem[]): ChatRecipeSuggestion[] {
  const lowered = items.map((item) => item.name.toLowerCase());

  if (lowered.includes("tomato") && lowered.includes("spinach")) {
    return [
      {
        title: "Warm Tomato Skillet",
        reason: "A quick one-pan dinner that uses fragile produce before it gets moody.",
        cookTime: "15 min",
        ingredients: ["Tomato", "Spinach", "Garlic", "Olive oil"],
        steps: [
          "Warm olive oil in a skillet and soften garlic until fragrant.",
          "Add tomatoes first so they blister and release some juices.",
          "Fold in spinach at the end and cook just until wilted.",
          "Season boldly and serve hot with toast, rice, or eggs.",
        ],
      },
      {
        title: "Green Toast Stack",
        reason: "Fast enough for lunch, solid enough for dinner.",
        cookTime: "10 min",
        ingredients: ["Spinach", "Tomato", "Bread", "Cheese"],
        steps: [
          "Toast the bread until crisp and ready for toppings.",
          "Quickly cook the tomato and spinach in a hot pan with oil.",
          "Layer the vegetables over the toast and add cheese on top.",
          "Melt, season, and serve while everything is still warm.",
        ],
      },
    ];
  }

  if (lowered.includes("egg") || lowered.includes("eggs")) {
    return [
      {
        title: "Soft Scramble Bowl",
        reason: "Eggs forgive a lot, which is excellent news for weeknights.",
        cookTime: "9 min",
        ingredients: ["Eggs", "Any vegetables", "Toast"],
        steps: [
          "Whisk the eggs with salt and a splash of water or milk.",
          "Cook any vegetables first until just tender.",
          "Lower the heat, add the eggs, and stir gently into soft curds.",
          "Serve right away with toast and a sharp finish like hot sauce or herbs.",
        ],
      },
    ];
  }

  if (lowered.includes("chicken breast") && lowered.includes("rice")) {
    return [
      {
        title: "Lemon Chicken Rice Bowl",
        reason: "Reliable, balanced, and very meal-prep friendly.",
        cookTime: "22 min",
        ingredients: ["Chicken Breast", "Rice", "Broccoli", "Lemon"],
        steps: [
          "Season and sear the chicken until browned and cooked through.",
          "Steam or roast the broccoli while the rice warms or cooks.",
          "Slice the chicken and build the bowl with rice and broccoli.",
          "Finish with lemon, salt, and any sauce you like before serving.",
        ],
      },
    ];
  }

  return [
    {
      title: "Fridge Sweep Stir-Fry",
      reason: "The safest way to turn randomness into a meal without overthinking it.",
      cookTime: "18 min",
      ingredients: ["Any vegetables", "Any protein", "Rice or noodles", "Soy sauce"],
      steps: [
        "Prep everything before turning on the heat so the stir-fry stays fast.",
        "Cook the protein first, then remove it if needed to avoid overcooking.",
        "Stir-fry the vegetables over high heat, then return the protein and add sauce.",
        "Serve over rice or noodles while the pan flavors still feel punchy.",
      ],
    },
  ];
}
