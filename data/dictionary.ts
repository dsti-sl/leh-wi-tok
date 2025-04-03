import { getDatabase } from '@/db/schema';
import { fetchDictionaryData } from '@/db/retrivedata';
import { fileDownloads } from '@/utils/filedownloads';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

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
    return result[0]?.count > 0;
  } catch (error) {
    console.error(`Error checking if word "${word}" exists:`, error);
    return false;
  }
};

/**
 * Updates an existing word in the database.
 * @param word The word to update
 * @param data The new data to update
 */
const updateWord = async (
  word: string,
  data: {
    definition: string;
    illustration?: string;
    image?: string;
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
        data.definition,
        data.illustration || null,
        data.image || null,
        data.partOfSpeech || null,
        JSON.stringify(data.categories || []),
        word,
      ],
    );

    console.log(`Word "${word}" updated successfully!`);
  } catch (error) {
    console.error(`Error updating word "${word}":`, error);
  }
};

/**
 * Inserts or updates dictionary data in the database.
 * Downloads and stores illustrations and images locally,
 * then saves their file paths in the database.
 * @param data Array of dictionary entries to insert or update
 */
export const insertDictionaryData = async (
  data: {
    word: string;
    definition: string;
    illustration?: string;
    image?: string;
    partOfSpeech?: string;
    categories?: string[];
  }[],
): Promise<void> => {
  if (!data || data.length === 0) return;

  try {
    const db = await getDatabase();

    // Download and prepare all items BEFORE transaction
    const preparedItems = await Promise.all(
      data.map(async (item) => {
        if (!item.word || !item.definition) {
          console.warn(
            'Skipping invalid entry (missing word/definition):',
            item,
          );
          return null;
        }

        try {
          const illustrationPath = item.illustration
            ? await fileDownloads(
                item.illustration,
                `${item.word}_illustration.gif`,
              )
            : null;

          const imagePath = item.image
            ? await fileDownloads(item.image, `${item.word}_image.png`)
            : null;

          return {
            ...item,
            illustrationPath,
            imagePath,
            categoriesJSON: JSON.stringify(item.categories || []),
          };
        } catch (err) {
          console.error(
            `Failed to download assets for word "${item.word}":`,
            err,
          );
          return null;
        }
      }),
    );

    // Start transaction
    await db.withTransactionAsync(async () => {
      for (const item of preparedItems) {
        if (!item) continue;

        // Check if the word already exists
        const wordExists = await doesWordExist(item.word);

        if (wordExists) {
          // Update the existing word
          await updateWord(item.word, {
            definition: item.definition,
            illustration: item.illustrationPath || undefined,
            image: item.imagePath || undefined,
            partOfSpeech: item.partOfSpeech,
            categories: JSON.parse(item.categoriesJSON || '[]'),
          });
        } else {
          // Insert the new word
          await db.runAsync(
            `INSERT INTO dictionary (word, definition, illustration, image, partOfSpeech, categories)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.word,
              item.definition,
              item.illustrationPath,
              item.imagePath,
              item.partOfSpeech || null,
              item.categoriesJSON,
            ],
          );
        }
      }
    });

    console.log('Dictionary data inserted or updated successfully!');
  } catch (error) {
    console.error('Error inserting or updating dictionary data:', error);
  }
};

/**
 * Fetches translation data from the API and stores it in the database in batches.
 */
export const fetchAndInsertTranslations = async (): Promise<void> => {
  if (!BASE_URL) {
    console.error('BASE_URL is not defined....');
    return;
  }

  const urlParams = `${BASE_URL}/translation?select=id,phrase,description,gesture(id,name,path,contentType),illustration(id,name,path,contentType),tags`;

  try {
    console.log(`Fetching data from API: ${urlParams}`);
    const response = await fetch(urlParams);

    if (!response.ok) {
      throw new Error(`Failed to fetch data from API: ${response.statusText}`);
    }

    const apiResponse = await response.json();
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
      throw new Error('Invalid API response structure');
    }

    const translations = apiResponse.data;

    // This processess translations data in to a batch of 50s
    const batchSize = 50;
    for (let i = 0; i < translations.length; i += batchSize) {
      const batch = translations.slice(i, i + batchSize);
      const transformedBatch = await Promise.all(
        batch.map(async (item: any) => {
          if (!item.phrase) {
            console.warn('Skipping entry with missing phrase:', item);
            return null;
          }

          try {
            const gesturePath = item.gesture?.path
              ? await fileDownloads(
                  item.gesture.path,
                  `${item.phrase}_gesture.png`,
                ).catch((err) => {
                  console.error(
                    `Failed to download gesture for "${item.phrase}":`,
                    err,
                  );
                  return null;
                })
              : null;

            const illustrationPath = item.illustration?.path
              ? await fileDownloads(
                  item.illustration.path,
                  `${item.phrase}_illustration.png`,
                ).catch((err) => {
                  console.error(
                    `Failed to download illustration for "${item.phrase}":`,
                    err,
                  );
                  return null;
                })
              : null;

            return {
              // Mapping translation to local db schema format
              word: item.phrase,
              definition: item.description || 'No description available',
              illustration: illustrationPath,
              image: gesturePath,
              partOfSpeech: null,
              categories: item.tags || [],
            };
          } catch (error) {
            console.error(`Error processing entry "${item.phrase}":`, error);
            return null;
          }
        }),
      );

      // This fililter out null entries
      const validData = transformedBatch.filter((item) => item !== null);

      if (validData.length > 0) {
        await insertDictionaryData(validData);
        console.log(`Processed batch of ${validData.length} entries.`);
      } else {
        console.warn('No valid data in this batch.');
      }
    }

    console.log('All translation data fetched and stored successfully!');
  } catch (error) {
    console.error('Error fetching and storing translation data:', error);
  }
};