import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDatabase } from '@/db/schema';
import { getBaseUrl, getToken } from '@/utils';
import { fileDownloads } from '@/utils/filedownloads';

const TRANSLATION_PAGE_SIZE = 100;
const TRANSLATION_REQUEST_TIMEOUT_MS = 15000;
const ASSET_DOWNLOAD_CONCURRENCY = 4;
const DICTIONARY_SYNC_LOCK_KEY = 'dictionarySyncInProgress';
const LAST_DICTIONARY_UPDATE_KEY = 'lastDictionaryUpdate';
const DICTIONARY_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TRANSLATION_SELECT_FIELDS =
  'id,phrase,description,gesture(id,name),illustration(id,name),tags(category,title)';

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

type StoredDictionaryRow = {
  word: string;
  definition: string;
  illustration: string | null;
  image: string | null;
  partOfSpeech: string | null;
  categories: string | null;
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

let inFlightDictionarySync: Promise<DictionarySyncResult> | null = null;

const setDictionarySyncLock = async (isSyncing: boolean): Promise<void> => {
  await AsyncStorage.setItem(
    DICTIONARY_SYNC_LOCK_KEY,
    JSON.stringify({
      startedAt: isSyncing ? Date.now() : null,
      syncing: isSyncing,
    }),
  );
};

const getDictionarySyncLockState = async (): Promise<{
  startedAt: number | null;
  syncing: boolean;
}> => {
  const rawValue = await AsyncStorage.getItem(DICTIONARY_SYNC_LOCK_KEY);

  if (!rawValue) {
    return { startedAt: null, syncing: false };
  }

  if (rawValue === 'true') {
    return { startedAt: null, syncing: true };
  }

  if (rawValue === 'false') {
    return { startedAt: null, syncing: false };
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      startedAt?: number | null;
      syncing?: boolean;
    };

    return {
      startedAt:
        typeof parsedValue.startedAt === 'number'
          ? parsedValue.startedAt
          : null,
      syncing: parsedValue.syncing === true,
    };
  } catch {
    return { startedAt: null, syncing: false };
  }
};

const createRequestTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

const getTranslationEndpoint = (baseUrl: string, page: number): string => {
  const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const searchParams = new URLSearchParams({
    select: TRANSLATION_SELECT_FIELDS,
    page: page.toString(),
    'page-size': TRANSLATION_PAGE_SIZE.toString(),
  });

  return `${baseUrlClean}/translation?${searchParams.toString()}`;
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
    const existingRows = db.getAllSync<StoredDictionaryRow>(
      'SELECT word, definition, illustration, image, partOfSpeech, categories FROM dictionary',
    );
    const existingEntriesByWord = new Map(
      existingRows
        .filter(row => typeof row.word === 'string' && row.word.length > 0)
        .map(row => [row.word, row] as const),
    );

    await db.withTransactionAsync(async () => {
      for (const item of data) {
        if (!item.word || !item.definition) {
          console.warn(
            'Skipping invalid entry (missing word/definition):',
            item,
          );
          continue;
        }

        const normalizedCategories = JSON.stringify(item.categories ?? []);
        const existingEntry = existingEntriesByWord.get(item.word);

        if (
          existingEntry &&
          existingEntry.definition === item.definition &&
          (existingEntry.illustration ?? null) ===
            (item.illustration ?? null) &&
          (existingEntry.image ?? null) === (item.image ?? null) &&
          (existingEntry.partOfSpeech ?? null) ===
            (item.partOfSpeech ?? null) &&
          (existingEntry.categories ?? '[]') === normalizedCategories
        ) {
          continue;
        }

        if (existingEntry) {
          await db.runAsync(
            `UPDATE dictionary
             SET definition = ?, illustration = ?, image = ?, partOfSpeech = ?, categories = ?
             WHERE word = ?`,
            [
              item.definition ?? null,
              item.illustration ?? null,
              item.image ?? null,
              item.partOfSpeech ?? null,
              normalizedCategories,
              item.word,
            ],
          );
          existingEntriesByWord.set(item.word, {
            word: item.word,
            definition: item.definition,
            illustration: item.illustration ?? null,
            image: item.image ?? null,
            partOfSpeech: item.partOfSpeech ?? null,
            categories: normalizedCategories,
          });
        } else {
          await db.runAsync(
            `INSERT INTO dictionary (word, definition, illustration, image, partOfSpeech, categories)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.word,
              item.definition,
              item.illustration,
              item.image,
              item.partOfSpeech || null,
              normalizedCategories, // categories need to be stringified for SQLite
            ],
          );
          existingEntriesByWord.set(item.word, {
            word: item.word,
            definition: item.definition,
            illustration: item.illustration ?? null,
            image: item.image ?? null,
            partOfSpeech: item.partOfSpeech ?? null,
            categories: normalizedCategories,
          });
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
export const fetchAndInsertTranslations =
  async (): Promise<DictionarySyncResult> => {
    if (inFlightDictionarySync) {
      return inFlightDictionarySync;
    }

    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('BASE_URL is not available');
    }

    inFlightDictionarySync = (async () => {
      await setDictionarySyncLock(true);

      try {
        const token = await getToken();
        const downloadCache = new Map<string, Promise<string>>();
        const getCachedAssetPath = async (
          asset?: DownloadableAsset,
        ): Promise<string | null> => {
          if (!asset?.id || !asset.name) {
            return null;
          }

          const cachedDownload =
            downloadCache.get(asset.id) ??
            fileDownloads(asset.id, asset.name, { baseUrl, token }).then(
              path => path || '',
            );

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
              .filter(
                tag =>
                  tag.category === 'categories' && tag.title.trim().length > 0,
              )
              .map(tag => tag.title.trim());

            return {
              word: item.phrase,
              definition: item.description || 'No description available',
              illustration: await getCachedAssetPath(item.illustration),
              image: await getCachedAssetPath(item.gesture),
              partOfSpeech: partOfSpeechTag?.title || null,
              categories: Array.from(new Set(categoryTags)),
            } satisfies LocalDictionaryEntry;
          },
        );

        await insertDictionaryData(transformedTranslations);

        const syncTime = Date.now().toString();
        await AsyncStorage.multiSet([
          [LAST_DICTIONARY_UPDATE_KEY, syncTime],
          [
            DICTIONARY_SYNC_LOCK_KEY,
            JSON.stringify({ startedAt: null, syncing: false }),
          ],
        ]);

        return { syncedCount: transformedTranslations.length };
      } catch (error) {
        await setDictionarySyncLock(false);
        console.error('Error fetching translation data:', error);
        throw error;
      } finally {
        inFlightDictionarySync = null;
      }
    })();

    return inFlightDictionarySync;
  };

/**
 * Checks if the Dictionary need to be updated and updates it if necessary.
 */
export const checkAndUpdateTranslations = async (options?: {
  force?: boolean;
}): Promise<void> => {
  try {
    const currentTime = new Date().getTime();
    const [lastUpdate, syncLockState] = await Promise.all([
      AsyncStorage.getItem(LAST_DICTIONARY_UPDATE_KEY),
      getDictionarySyncLockState(),
    ]);

    if (inFlightDictionarySync) {
      await inFlightDictionarySync;
      return;
    }

    if (syncLockState.syncing) {
      const syncStartedAt = syncLockState.startedAt ?? 0;
      const syncLockIsFresh =
        syncStartedAt > 0 &&
        currentTime - syncStartedAt < TRANSLATION_REQUEST_TIMEOUT_MS * 2;

      if (syncLockIsFresh) {
        return;
      }

      await setDictionarySyncLock(false);
    }

    if (options?.force) {
      await fetchAndInsertTranslations();
      return;
    }

    // Check for updates if last update was more than 24 hours ago or never
    if (
      !lastUpdate ||
      Number.isNaN(parseInt(lastUpdate, 10)) ||
      currentTime - parseInt(lastUpdate, 10) > DICTIONARY_SYNC_INTERVAL_MS
    ) {
      await fetchAndInsertTranslations();
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
