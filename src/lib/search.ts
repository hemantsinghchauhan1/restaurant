/**
 * Advanced Dish & Order Search Engine
 * Features: Typo-tolerance, Multi-field matching, Result Ranking, and Combinable Filters
 */

// Helper to compute Levenshtein distance for typo-tolerant fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Common food term alias mapping for enhanced fuzzy recall
const ALIASES: Record<string, string[]> = {
  panner: ['paneer'],
  paner: ['paneer'],
  biryani: ['biryani', 'pulao'],
  birani: ['biryani'],
  noodle: ['noodles', 'noodle', 'chowmein'],
  noodles: ['noodles', 'noodle', 'chowmein'],
  haka: ['hakka'],
  sezwan: ['schezwan', 'sehzwan'],
  schezwan: ['schezwan', 'sehzwan'],
  chicken: ['chickn', 'chikn', 'chilli'],
};

export interface FilterOptions {
  query?: string;
  categoryIds?: string[];
  isVeg?: boolean | null;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc';
}

export function filterAndRankDishes(dishes: any[], options: FilterOptions) {
  const {
    query = '',
    categoryIds = [],
    isVeg = null,
    minPrice = 0,
    maxPrice = Infinity,
    inStockOnly = false,
    sortBy = 'recommended',
  } = options;

  const cleanQuery = query.trim().toLowerCase();

  let filtered = dishes.filter((dish) => {
    // Category filter
    if (categoryIds.length > 0 && !categoryIds.includes(dish.categoryId)) {
      return false;
    }

    // Veg / Non-Veg filter
    if (isVeg !== null && dish.isVeg !== isVeg) {
      return false;
    }

    // Stock filter
    if (inStockOnly && !dish.inStock) {
      return false;
    }

    // Price filter
    const effectivePrice = dish.price;
    if (effectivePrice < minPrice || effectivePrice > maxPrice) {
      return false;
    }

    return true;
  });

  if (!cleanQuery) {
    // Sort without search query
    return sortDishes(filtered, sortBy);
  }

  // Rank dishes based on search query match strength
  const scoredDishes = filtered
    .map((dish) => {
      const name = dish.name.toLowerCase();
      const desc = dish.description.toLowerCase();
      const categoryName = (dish.categoryName || dish.category?.name || '').toLowerCase();

      let score = 0;

      // 1. Exact Name Match
      if (name === cleanQuery) {
        score += 100;
      }
      // 2. Starts with Query
      else if (name.startsWith(cleanQuery)) {
        score += 80;
      }
      // 3. Name contains query
      else if (name.includes(cleanQuery)) {
        score += 60;
      }

      // 4. Word-by-word matching & typo-tolerance
      const queryWords = cleanQuery.split(/\s+/);
      const nameWords = name.split(/\s+/);

      for (const qWord of queryWords) {
        if (qWord.length < 2) continue;

        // Check aliases
        const aliases = ALIASES[qWord] || [];

        for (const nWord of nameWords) {
          if (nWord === qWord || aliases.includes(nWord)) {
            score += 40;
          } else if (nWord.includes(qWord)) {
            score += 25;
          } else {
            const dist = levenshteinDistance(qWord, nWord);
            if (dist <= 2 && qWord.length >= 4) {
              score += 35 - dist * 10; // Fuzzy score for typos like "panner" -> "paneer"
            }
          }
        }

        // Category name match
        if (categoryName.includes(qWord)) {
          score += 20;
        }

        // Description match
        if (desc.includes(qWord)) {
          score += 15;
        }
      }

      return { dish, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.dish);

  return sortDishes(scoredDishes, sortBy, true);
}

function sortDishes(dishes: any[], sortBy: string, hasQueryScore = false) {
  if (hasQueryScore && sortBy === 'recommended') {
    return dishes; // Keep score order
  }

  return [...dishes].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price_desc') {
      return b.price - a.price;
    }
    if (sortBy === 'rating_desc') {
      return (b.avgRating || 0) - (a.avgRating || 0);
    }
    return 0;
  });
}
