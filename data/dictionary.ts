import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDatabase } from '@/db/schema';
import { getBaseUrl } from '@/utils';
import { fileDownloads } from '@/utils/filedownloads';

interface ApiTranslationItem {
  id: string;
  phrase: string;
  description: string;
  gesture?: { id: string; name: string; path: string; contentType: string }; // Assuming these have IDs now
  illustration?: {
    id: string;
    name: string;
    path: string;
    contentType: string;
  };
  tags?: { category: string; title: string }[];
}

export interface LocalDictionaryEntry {
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string[];
}

/**
 * To check if a word already exists in the database.
 * @param word The word to check
 * @returns True if the word exists, false otherwise
 */
const doesWordExist = async (word: string): Promise<boolean> => {
  try {
    const db = await getDatabase();
    const result = db.getAllSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM dictionary WHERE word = ?',
      [word],
    );
    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error(`Error checking if word "${word}" exists:`, error);
    return false;
  }
};

/**
 * Updates an existing word in the database.
 * @param word
 * @param data
 */
const updateWord = async (
  word: string,
  data: {
    definition: string;
    illustration?: string | null;
    image?: string | null;
    partOfSpeech?: string;
    categories?: string[];
  },
): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE dictionary
       SET definition = ?, illustration = ?, image = ?, partOfSpeech = ?, categories = ?
       WHERE word = ?`,
      [
        data.definition ?? null,
        data.illustration ?? null,
        data.image ?? null,
        data.partOfSpeech ?? null,
        JSON.stringify(data.categories ?? []),
        word,
      ],
    );
  } catch (error) {
    console.error('Error updating word:', error);
  }
};

/**
 * Don't mess this up.
 * Inserts or updates dictionary data in the database.
 * Downloads and stores illustrations and images locally,
 * then saves their file paths in the database.
 * @param data Array of dictionary entries (LocalDictionaryEntry) to insert or update
 */
export const insertDictionaryData = async (
  data: LocalDictionaryEntry[],
): Promise<void> => {
  if (!data || data.length === 0) return;

  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      for (const item of data) {
        if (!item.word || !item.definition) {
          console.warn(
            'Skipping invalid entry (missing word/definition):',
            item,
          );
          continue;
        }

        const wordExists = await doesWordExist(item.word);

        if (wordExists) {
          const updateData: Parameters<typeof updateWord>[1] = {
            definition: item.definition,
          };

          if (item.illustration !== undefined) {
            updateData.illustration = item.illustration;
          }
          if (item.image !== undefined) {
            updateData.image = item.image;
          }
          if (item.partOfSpeech !== null) {
            updateData.partOfSpeech = item.partOfSpeech ?? undefined;
          }
          if (item.categories !== undefined) {
            updateData.categories = item.categories;
          }

          await updateWord(item.word, updateData);
        } else {
          // Insert the new word
          await db.runAsync(
            `INSERT INTO dictionary (word, definition, illustration, image, partOfSpeech, categories)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.word,
              item.definition,
              item.illustration,
              item.image,
              item.partOfSpeech || null,
              JSON.stringify(item.categories || []), // categories need to be stringified for SQLite
            ],
          );
        }
      }
    });
  } catch (error) {
    console.error('Error inserting or updating dictionary data:', error);
  }
};

/**
 * Fetches dictionary data from the API and processes it.
 * This function will now handle downloading images and converting them to local URIs.
 */
export const fetchAndInsertTranslations = async (): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.error('BASE_URL is not available!');
      return;
    }

    const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Backend's translation endpoint. Processes words in a batch of 50s.
    const urlParams = `${baseUrlClean}/translation?select=id,phrase,description,
    gesture(id,name,path,contentType),illustration(id,name,path,contentType),
    tags(category,title)&page-size=50`;
    const response = await fetch(urlParams);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch data from API: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const apiResponse = await response.json();
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
      throw new Error('Invalid API response structure');
    }

    let translations: ApiTranslationItem[] = apiResponse.data;
    translations = translations.sort((a, b) =>
      a.phrase.localeCompare(b.phrase, undefined, { numeric: true }),
    );

    const batchSize = 50;
    for (let i = 0; i < translations.length; i += batchSize) {
      const batch = translations.slice(i, i + batchSize);

      // Transform and download assets for the current batch
      const transformedBatch = await Promise.all(
        batch.map(async item => {
          if (!item.phrase) {
            console.warn('Skipping entry with missing phrase:', item);
            return null;
          }

          try {
            const tags = item.tags || [];
            const partOfSpeechTag = tags.find(
              tag => tag.category === 'part-of-speech',
            );
            const categoriesTags = tags
              .filter(tag => tag.category === 'categories')
              .map(tag => tag.title);

            const partOfSpeech = partOfSpeechTag?.title || null;

            // Use fileDownloads with the image ID and the original filename.
            // Fuck. Nobody should fuck with this section.
            const gesturePath =
              item.gesture?.id && item.gesture?.name
                ? await fileDownloads(item.gesture.id, item.gesture.name).catch(
                    () => null,
                  )
                : null;

            const illustrationPath =
              item.illustration?.id && item.illustration?.name
                ? await fileDownloads(
                    item.illustration.id,
                    item.illustration.name,
                  ).catch(() => null)
                : null;

            return {
              word: item.phrase,
              definition: item.description || 'No description available',
              illustration: illustrationPath,
              image: gesturePath,
              partOfSpeech,
              categories: categoriesTags,
            } as LocalDictionaryEntry;
          } catch (error) {
            return null;
          }
        }),
      );

      const validData = transformedBatch.filter(
        item => item !== null,
      ) as LocalDictionaryEntry[];

      if (validData.length > 0) {
        await insertDictionaryData(validData);
      }
    }
  } catch (error) {
    console.error('Error fetching translation data:', error);
    // Don't throw the error to avoid breaking the app
  }
};

/**
 * Checks if the Dictionary need to be updated and updates it if necessary.
 */
export const checkAndUpdateTranslations = async (): Promise<void> => {
  try {
    const lastUpdateKey = 'lastDictionaryUpdate';
    const currentTime = new Date().getTime();
    const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);

    // Check for updates if last update was more than 24 hours ago or never
    if (
      !lastUpdate ||
      currentTime - parseInt(lastUpdate) > 24 * 60 * 60 * 1000
    ) {
      await fetchAndInsertTranslations();
      await AsyncStorage.setItem(lastUpdateKey, currentTime.toString());
    }
  } catch (error) {
    console.error('Error checking for dictionary updates:', error);
  }
};

export const fetchDictionaryData = async (): Promise<
  LocalDictionaryEntry[]
> => {
  try {
    const db = await getDatabase();
    const results = db.getAllSync<LocalDictionaryEntry>(
      'SELECT word, definition, illustration, image, partOfSpeech, categories FROM dictionary',
    );

    return results.map(row => ({
      ...row,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories: JSON.parse((row.categories as any) || '[]'),
    }));
  } catch (error) {
    console.error('Error fetching dictionary data from local DB:', error);
    return [];
  }
};
