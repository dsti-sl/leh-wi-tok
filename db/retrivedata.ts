import { getDatabase } from './schema';

export type DictionaryEntry = {
  id: number;
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string[];
};

/**
 * Fetches all dictionary entries from the database.
 * @returns Array of dictionary entries
 */
export const fetchDictionaryData = async (): Promise<DictionaryEntry[]> => {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync<DictionaryEntry>(
      'SELECT * FROM dictionary ORDER BY word ASC',
    );

    // Parse categories JSON safely
    const parsedData = rows.map(item => ({
      ...item,
      categories:
        typeof item.categories === 'string'
          ? safeParseJSON(item.categories)
          : [],
    }));

    console.log(
      'Dictionary data fetched successfully!',
      JSON.stringify(parsedData, null, 2),
    );
    return parsedData;
  } catch (error) {
    console.error('Error fetching dictionary data:', error);
    return [];
  }
};

/**
 * Fetches dictionary entries for a specific category from the database.
 * Uses client-side filtering since SQLite JSON functions may vary.
 * @param categoryName The category to filter by
 * @returns Array of dictionary entries in that category
 */
export const fetchCategoryData = async (
  categoryName: string,
): Promise<DictionaryEntry[]> => {
  try {
    const db = await getDatabase();

    const rows = await db.getAllAsync<DictionaryEntry>(
      'SELECT * FROM dictionary ORDER BY word ASC',
    );

    // Parse categories JSON and filter by category
    const parsedData = rows
      .map(item => ({
        ...item,
        categories:
          typeof item.categories === 'string'
            ? safeParseJSON(item.categories)
            : [],
      }))
      .filter(item => item.categories.includes(categoryName));

    return parsedData;
  } catch (error) {
    console.error('Error fetching category data:', error);
    return [];
  }
};

/**
 * Searches for words in a specific category using SQLite.
 * Optimized with LIKE query on word field.
 * @param categoryName The category to search in
 * @param searchQuery The search term
 * @returns Array of matching dictionary entries
 */
export const searchCategoryData = async (
  categoryName: string,
  searchQuery: string,
): Promise<DictionaryEntry[]> => {
  try {
    if (!searchQuery.trim()) {
      return fetchCategoryData(categoryName);
    }

    const db = await getDatabase();
    const searchTerm = `%${searchQuery.toLowerCase()}%`;

    // Use SQLite LIKE for case-insensitive search on word field
    const rows = await db.getAllAsync<DictionaryEntry>(
      'SELECT * FROM dictionary WHERE LOWER(word) LIKE ? ORDER BY word ASC',
      [searchTerm],
    );

    // Parse categories JSON and filter by category
    const parsedData = rows
      .map(item => ({
        ...item,
        categories:
          typeof item.categories === 'string'
            ? safeParseJSON(item.categories)
            : [],
      }))
      .filter(item => item.categories.includes(categoryName));

    return parsedData;
  } catch (error) {
    console.error('Error searching category data:', error);
    return [];
  }
};

/**
 * Searches for words across all dictionary using SQLite.
 * Used for global search on the index/main dictionary page.
 * @param searchQuery The search term
 * @returns Array of matching dictionary entries
 */
export const searchDictionaryByWord = async (
  searchQuery: string,
): Promise<DictionaryEntry[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const db = await getDatabase();
    const searchTerm = `%${searchQuery.toLowerCase()}%`;

    // Use SQLite LIKE for case-insensitive search on word field
    const rows = await db.getAllAsync<DictionaryEntry>(
      'SELECT * FROM dictionary WHERE LOWER(word) LIKE ? ORDER BY word ASC',
      [searchTerm],
    );

    // Parse categories JSON
    const parsedData = rows.map(item => ({
      ...item,
      categories:
        typeof item.categories === 'string'
          ? safeParseJSON(item.categories)
          : [],
    }));

    return parsedData;
  } catch (error) {
    console.error('Error searching dictionary by word:', error);
    return [];
  }
};

// This supposed to safely parse JSON, fallback to array if fails.
function safeParseJSON(input: string | null): string[] {
  try {
    return input ? JSON.parse(input) : [];
  } catch {
    return [];
  }
}
