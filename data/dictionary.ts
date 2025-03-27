import { getDatabase } from '@/db/schema';
import { fileDownloads } from '@/utils/filedownloads';

/**
 * Inserts dictionary data into the database.
 * Downloads and stores illustrations and images locally,
 * then saves their file paths in the database.
 * @param data Array of dictionary entries to insert
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
            `⚠️ Failed to download assets for word "${item.word}":`,
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
    });

    console.log('Dictionary data inserted successfully!');
  } catch (error) {
    console.error('Error inserting dictionary data:', error);
  }
};
