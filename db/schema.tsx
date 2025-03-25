import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// This function here is to create and  initialize the database.
export const initializeDatabase = async (): Promise<void> => {
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

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

// This function here is to get the database instance.
// But this will only work after the database has been initialized.
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('le-wi-tok.db');
  }
  return db;
};

export default getDatabase;
