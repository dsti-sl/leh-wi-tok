import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let isInitialized = false;

// This function here is to create and  initialize the database.
export const initializeDatabase = async (): Promise<boolean> => {
  if (isInitialized) return true;
  if (isInitializing) {
    // Wait for initialization to complete
    let attempts = 0;
    while (isInitializing && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return isInitialized;
  }

  isInitializing = true;

  try {
    if (!db) {
      db = await SQLite.openDatabaseAsync('le-wi-tok.db');
    }

    await db.execAsync(`
      PRAGMA journal_mode = WAL; -- Improve performance
      PRAGMA foreign_keys = ON; -- Enable foreign key constraints

      CREATE TABLE IF NOT EXISTS dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        definition TEXT NOT NULL,
        illustration TEXT, -- Local file path for illustration (gif/video)
        image TEXT, -- Local file path for image
        partOfSpeech TEXT,
        categories TEXT -- JSON string for categories
      );
    `);

    isInitialized = true;
    return true;
  } catch (error) {
    isInitialized = false;
    return false;
  } finally {
    isInitializing = false;
  }
};

// Get the database instance.
// This will ensure database is initialized before returning.
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!isInitialized) {
    const success = await initializeDatabase();
    if (!success) {
      throw new Error('Failed to initialize database');
    }
  }

  if (!db) {
    throw new Error('Database not available');
  }

  return db;
};

export default getDatabase;
