import { getDatabase } from '@/db/schema';
import { fetchDictionaryData } from '@/db/retrivedata';
import { fileDownloads } from '@/utils/filedownloads';

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
 * Test function to insert or update and fetch data from the database.
 */
const testInsertAndFetch = async () => {
  try {
    // Step 1: Insert or Update Sample Data
    const sampleData = [
      {
        word: 'A',
        definition: 'The fucking first letter of the English alphabet.',
        illustration: 'https://example.com/illustrations/A.gif',
        image: 'https://example.com/images/A.png',
        partOfSpeech: 'noun',
        categories: ['Alphabets'],
      },
      {
        word: 'B',
        definition: 'The fucking second letter of the English alphabet.',
        illustration: 'https://example.com/illustrations/B.gif',
        image: 'https://example.com/images/B.png',
        partOfSpeech: 'noun',
        categories: ['Alphabets'],
      },
      {
        word: 'C',
        definition:
          'Updated definition for the first letter of the English alphabet.',
        illustration: 'https://example.com/illustrations/A_updated.gif',
        image: 'https://example.com/images/A_updated.png',
        partOfSpeech: 'noun',
        categories: ['Alphabets', 'Updated'],
      },
    ];

    console.log('Inserting or updating sample data...');
    await insertDictionaryData(sampleData);

    // Step 2: Fetch Data from the Database
    console.log('Fetching data from the database...');
    const fetchedData = await fetchDictionaryData();

    // Step 3: Log the Results in JSON Format
    console.log('Fetched Data (JSON):', JSON.stringify(fetchedData, null, 2));
  } catch (error) {
    console.error('Error during test insert or update and fetch:', error);
  }
};

export default testInsertAndFetch;
