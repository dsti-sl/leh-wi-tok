import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDatabase } from '@/db/schema';
import { getBaseUrl } from '@/utils';
import { fileDownloads } from '@/utils/filedownloads';

const TRANSLATION_PAGE_SIZE = 50;
const TRANSLATION_REQUEST_TIMEOUT_MS = 15000;
const ASSET_DOWNLOAD_CONCURRENCY = 4;

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

interface ApiTranslationResponse {
  data: ApiTranslationItem[];
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
  };
}

type DownloadableAsset = {
  id: string;
  name: string;
};

export interface LocalDictionaryEntry {
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string[];
}

export interface DictionarySyncResult {
  syncedCount: number;
}

/**
 * To check if a word already exists in the database.
 * @param word The word to check
 * @returns True if the word exists, false otherwise
 */
/*
const doesWordExist = async (word: string): Promise<boolean> => {
  try {
    const db = await getDatabase();
    const result = db.getAllSync<{ count: number }>
      'SELECT COUNT(*) as count FROM dictionary WHERE word = ?',
      [word],
    );
    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error(`Error checking if word "${word}" exists:`, error);
    return false;
  }
};
*/

/**
 * Updates an existing word in the database.
 * @param word
 * @param data
 */
/*
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
*/

const createRequestTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

const getTranslationEndpoint = (baseUrl: string, page: number): string => {
  const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${baseUrlClean}/translation?select=id,phrase,description,
    gesture(id,name,path,contentType),illustration(id,name,path,contentType),
    tags(category,title)&page=${page}&page-size=${TRANSLATION_PAGE_SIZE}`;
};

const fetchTranslationPage = async (
  baseUrl: string,
  page: number,
): Promise<ApiTranslationResponse> => {
  const response = await fetch(getTranslationEndpoint(baseUrl, page), {
    signal: createRequestTimeoutSignal(TRANSLATION_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch translations page ${page}: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const payload = (await response.json()) as ApiTranslationResponse;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error(`Invalid translation response on page ${page}`);
  }

  return payload;
};

const fetchAllTranslations = async (
  baseUrl: string,
): Promise<ApiTranslationItem[]> => {
  const translations: ApiTranslationItem[] = [];
  let page = 1;
  let expectedTotal: number | null = null;
  let hasMorePages = true;

  while (hasMorePages) {
    const payload = await fetchTranslationPage(baseUrl, page);
    const pageItems = payload.data;

    if (expectedTotal === null && typeof payload.meta?.count === 'number') {
      expectedTotal = payload.meta.count;
    }

    translations.push(...pageItems);

    const reachedKnownTotal =
      expectedTotal !== null && translations.length >= expectedTotal;
    const reachedLastPage = pageItems.length < TRANSLATION_PAGE_SIZE;

    hasMorePages = !(reachedKnownTotal || reachedLastPage);
    page += 1;
  }

  return translations;
};

const dedupeTranslationsByPhrase = (
  translations: ApiTranslationItem[],
): ApiTranslationItem[] => {
  const uniqueTranslations = new Map<string, ApiTranslationItem>();

  for (const item of translations) {
    const phrase = item.phrase?.trim();
    if (!phrase) {
      continue;
    }

    if (!uniqueTranslations.has(phrase)) {
      uniqueTranslations.set(phrase, { ...item, phrase });
    }
  }

  return Array.from(uniqueTranslations.values()).sort((a, b) =>
    a.phrase.localeCompare(b.phrase, undefined, { numeric: true }),
  );
};

const runWithConcurrency = async <TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> => {
  if (items.length === 0) {
    return [];
  }

  const results: TOutput[] = new Array(items.length);
  let currentIndex = 0;

  const consume = async () => {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      const item = items[index];
      if (item === undefined) {
        return;
      }
      results[index] = await worker(item);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () =>
      consume(),
    ),
  );

  return results;
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
    const validEntries = data.filter(item => {
      if (!item.word || !item.definition) {
        console.warn('Skipping invalid entry (missing word/definition):', item);
        return false;
      }

      return true;
    });

    if (validEntries.length === 0) {
      return;
    }

    await db.withTransactionAsync(async () => {
      // Keep local DB fully aligned with latest server snapshot across devices.
      await db.runAsync('DELETE FROM dictionary');

      for (const item of validEntries) {
        await db.runAsync(
          `INSERT INTO dictionary (word, definition, illustration, image, partOfSpeech, categories)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            item.word,
            item.definition,
            item.illustration,
            item.image,
            item.partOfSpeech || null,
            JSON.stringify(item.categories || []),
          ],
        );
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
export const fetchAndInsertTranslations =
  async (): Promise<DictionarySyncResult> => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('BASE_URL is not available');
    }

    try {
      const downloadCache = new Map<string, Promise<string>>();
      const getCachedAssetPath = async (
        asset?: DownloadableAsset,
      ): Promise<string | null> => {
        if (!asset?.id || !asset.name) {
          return null;
        }

        const cachedDownload =
          downloadCache.get(asset.id) ??
          fileDownloads(asset.id, asset.name).then(path => path || '');

        downloadCache.set(asset.id, cachedDownload);

        const localPath = await cachedDownload;
        return localPath || null;
      };

      const translations = dedupeTranslationsByPhrase(
        await fetchAllTranslations(baseUrl),
      );

      const transformedTranslations = await runWithConcurrency(
        translations,
        ASSET_DOWNLOAD_CONCURRENCY,
        async item => {
          const tags = item.tags || [];
          const partOfSpeechTag = tags.find(
            tag => tag.category === 'part-of-speech',
          );
          const categoryTags = tags
            .filter(tag => tag.category === 'categories')
            .map(tag => tag.title);

          return {
            word: item.phrase,
            definition: item.description || 'No description available',
            illustration: await getCachedAssetPath(item.illustration),
            image: await getCachedAssetPath(item.gesture),
            partOfSpeech: partOfSpeechTag?.title || null,
            categories: categoryTags,
          } satisfies LocalDictionaryEntry;
        },
      );

      await insertDictionaryData(transformedTranslations);
      return { syncedCount: transformedTranslations.length };
    } catch (error) {
      console.error('Error fetching translation data:', error);
      throw error;
    }
  };

/**
 * Checks if the Dictionary need to be updated and updates it if necessary.
 */
export const checkAndUpdateTranslations = async (options?: {
  force?: boolean;
}): Promise<void> => {
  try {
    const lastUpdateKey = 'lastDictionaryUpdate';
    const currentTime = new Date().getTime();
    const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
    const shouldForceSync = options?.force === true;

    // Check for updates if last update was more than 24 hours ago or never
    if (
      shouldForceSync ||
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
