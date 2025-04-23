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
    const parsedData = rows.map((item) => ({
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

// This supposed to safely parse JSON, fallback to array if fails.
function safeParseJSON(input: string | null): string[] {
  try {
    return input ? JSON.parse(input) : [];
  } catch {
    return [];
  }
}
