import { getDatabase } from '@/db/schema';

/**
 * This function deletes all entries from the dictionary table and resets the auto-increment ID.
 * This function should be used with caution as it will remove all data.
 * So niggas becarful....(:
 */
export const deleteAllEntries = async (): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM dictionary;');

      await db.runAsync(
        'DELETE FROM sqlite_sequence WHERE name = "dictionary";',
      );
    });

    console.log('All entries deleted and IDs reset successfully!');
  } catch (error) {
    console.error('Error deleting all entries and resetting IDs:', error);
  }
};
