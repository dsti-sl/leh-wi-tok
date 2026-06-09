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

export type DictionaryCategorySummary = {
  name: string;
  imageSource: string | null;
  wordCount: number;
};

type DictionaryRow = Omit<DictionaryEntry, 'categories'> & {
  categories: string | null;
};

type DictionaryQueryOptions = {
  limit?: number;
  offset?: number;
};

const CATEGORY_SEPARATOR = '\u001f';

const mapDictionaryRow = (item: DictionaryRow): DictionaryEntry => ({
  ...item,
  categories: safeParseCategories(item.categories),
});

const dictionarySelect = `
  SELECT
    d.id,
    d.word,
    d.definition,
    d.illustration,
    d.image,
    d.partOfSpeech,
    (
      SELECT GROUP_CONCAT(dc.category, '${CATEGORY_SEPARATOR}')
      FROM dictionary_categories dc
      WHERE dc.word = d.word COLLATE NOCASE
    ) AS categories
  FROM dictionary d
`;

const dictionarySelectFromCategory = `
  SELECT
    d.id,
    d.word,
    d.definition,
    d.illustration,
    d.image,
    d.partOfSpeech,
    (
      SELECT GROUP_CONCAT(dc.category, '${CATEGORY_SEPARATOR}')
      FROM dictionary_categories dc
      WHERE dc.word = d.word COLLATE NOCASE
    ) AS categories
  FROM dictionary_categories category_filter
  JOIN dictionary d ON d.word = category_filter.word COLLATE NOCASE
`;

const ensureDictionaryCategoryIndex = async (): Promise<void> => {
  const db = await getDatabase();
  const categoryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM dictionary_categories',
  );

  if ((categoryCount?.count ?? 0) > 0) {
    return;
  }

  const dictionaryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM dictionary',
  );

  if ((dictionaryCount?.count ?? 0) === 0) {
    return;
  }

  const rows = await db.getAllAsync<{
    word: string;
    categories: string | null;
  }>('SELECT word, categories FROM dictionary');
  const insertCategoryStatement = await db.prepareAsync(
    `INSERT OR IGNORE INTO dictionary_categories (word, category)
     VALUES (?, ?)`,
  );

  try {
    await db.withTransactionAsync(async () => {
      for (const row of rows) {
        for (const category of safeParseCategories(row.categories)) {
          await insertCategoryStatement.executeAsync(row.word, category);
        }
      }
    });
  } finally {
    await insertCategoryStatement.finalizeAsync();
  }
};

/**
 * Fetches all dictionary entries from the database.
 * @returns Array of dictionary entries
 */
export const fetchDictionaryData = async (): Promise<DictionaryEntry[]> => {
  try {
    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();

    const rows = await db.getAllAsync<DictionaryRow>(
      `${dictionarySelect} ORDER BY d.word COLLATE NOCASE ASC`,
    );

    return rows.map(mapDictionaryRow);
  } catch (error) {
    console.error('Error fetching dictionary data:', error);
    return [];
  }
};

export const fetchDictionaryCategories = async (): Promise<
  DictionaryCategorySummary[]
> => {
  try {
    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();

    const rows = await db.getAllAsync<DictionaryCategorySummary>(
      `
        SELECT
          dc.category AS name,
          COALESCE(
            MIN(NULLIF(d.image, '')),
            MIN(NULLIF(d.illustration, ''))
          ) AS imageSource,
          COUNT(*) AS wordCount
        FROM dictionary_categories dc
        JOIN dictionary d ON d.word = dc.word COLLATE NOCASE
        GROUP BY dc.category
        ORDER BY dc.category COLLATE NOCASE ASC
      `,
    );

    return rows;
  } catch (error) {
    console.error('Error fetching dictionary categories:', error);
    return [];
  }
};

export const fetchDictionaryEntryByWord = async (
  word: string,
): Promise<DictionaryEntry | null> => {
  try {
    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();

    const row = await db.getFirstAsync<DictionaryRow>(
      `
        ${dictionarySelect}
        WHERE d.word = ? COLLATE NOCASE
        LIMIT 1
      `,
      [word],
    );

    return row ? mapDictionaryRow(row) : null;
  } catch (error) {
    console.error('Error fetching dictionary entry by word:', error);
    return null;
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
  options: DictionaryQueryOptions = {},
): Promise<DictionaryEntry[]> => {
  try {
    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const rows = await db.getAllAsync<DictionaryRow>(
      `
        ${dictionarySelectFromCategory}
        WHERE category_filter.category = ? COLLATE NOCASE
        ORDER BY d.word COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `,
      [categoryName, limit, offset],
    );

    return rows.map(mapDictionaryRow);
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
  options: DictionaryQueryOptions = {},
): Promise<DictionaryEntry[]> => {
  try {
    if (!searchQuery.trim()) {
      return fetchCategoryData(categoryName, options);
    }

    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();
    const searchTerm = `%${searchQuery.toLowerCase()}%`;
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const rows = await db.getAllAsync<DictionaryRow>(
      `
        ${dictionarySelectFromCategory}
        WHERE category_filter.category = ? COLLATE NOCASE
          AND LOWER(d.word) LIKE ?
        ORDER BY d.word COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `,
      [categoryName, searchTerm, limit, offset],
    );

    return rows.map(mapDictionaryRow);
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
  options: DictionaryQueryOptions = {},
): Promise<DictionaryEntry[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const db = await getDatabase();
    await ensureDictionaryCategoryIndex();
    const searchTerm = `%${searchQuery.toLowerCase()}%`;
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const rows = await db.getAllAsync<DictionaryRow>(
      `
        ${dictionarySelect}
        WHERE LOWER(d.word) LIKE ?
        ORDER BY d.word COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `,
      [searchTerm, limit, offset],
    );

    return rows.map(mapDictionaryRow);
  } catch (error) {
    console.error('Error searching dictionary by word:', error);
    return [];
  }
};

function safeParseCategories(input: string | null): string[] {
  if (!input) {
    return [];
  }

  if (input.includes(CATEGORY_SEPARATOR)) {
    return input.split(CATEGORY_SEPARATOR).filter(Boolean);
  }

  try {
    const value = JSON.parse(input);
    return Array.isArray(value)
      ? value.filter(
          (category): category is string => typeof category === 'string',
        )
      : [];
  } catch {
    return [input].filter(Boolean);
  }
}
