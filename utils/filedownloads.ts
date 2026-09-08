import * as FileSystem from 'expo-file-system/legacy';

import { getBaseUrl, getToken } from '.';

const MIN_IMAGE_FILE_SIZE_BYTES = 100;

type FileDownloadOptions = {
  contentType?: string;
  version?: string;
};

type CachedAssetMetadata = {
  contentType?: string;
  version?: string;
  size?: number;
};

const getSafeAssetFilename = (fileId: string, filename: string): string => {
  const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${safeId}_${safeName}`;
};

const toFileUri = (path: string): string =>
  path.startsWith('file://') ? path : `file://${path}`;

const getHeader = (
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined => {
  if (!headers) return undefined;
  const header = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  return header?.[1];
};

const isImageContentType = (value?: string | null): boolean =>
  typeof value === 'string' && value.toLowerCase().startsWith('image/');

const normalizeContentType = (value?: string | null): string | undefined => {
  const normalized = value?.toLowerCase().split(';')[0]?.trim();
  return normalized || undefined;
};

const readCachedMetadata = async (
  metadataPath: string,
): Promise<CachedAssetMetadata | null> => {
  try {
    const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
    if (!metadataInfo.exists) return null;

    const rawMetadata = await FileSystem.readAsStringAsync(metadataPath);
    return JSON.parse(rawMetadata) as CachedAssetMetadata;
  } catch {
    return null;
  }
};

const writeCachedMetadata = async (
  metadataPath: string,
  metadata: CachedAssetMetadata,
): Promise<void> => {
  await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
};

const isCachedFileFresh = async (
  localPath: string,
  metadataPath: string,
  options: FileDownloadOptions,
): Promise<boolean> => {
  const [fileInfo, metadata] = await Promise.all([
    FileSystem.getInfoAsync(localPath),
    readCachedMetadata(metadataPath),
  ]);

  if (
    !fileInfo.exists ||
    !('size' in fileInfo) ||
    !fileInfo.size ||
    fileInfo.size <= MIN_IMAGE_FILE_SIZE_BYTES ||
    !metadata
  ) {
    return false;
  }

  if (!isImageContentType(metadata.contentType)) {
    return false;
  }

  if (
    options.contentType &&
    normalizeContentType(metadata.contentType) !==
      normalizeContentType(options.contentType)
  ) {
    return false;
  }

  return !options.version || metadata.version === options.version;
};

const hasImageSignature = async (
  uri: string,
  contentType?: string | null,
): Promise<boolean> => {
  if (!isImageContentType(contentType)) return false;

  const normalizedContentType = normalizeContentType(contentType);
  const header = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    position: 0,
    length: 16,
  });

  if (normalizedContentType === 'image/svg+xml') {
    return (
      header.startsWith('PHN2Zy') ||
      header.startsWith('PD94bWw') ||
      header.startsWith('Cjxzdmc')
    );
  }

  return (
    header.startsWith('iVBORw0KGgo') ||
    header.startsWith('/9j/') ||
    header.startsWith('R0lGOD') ||
    header.startsWith('UklGR') ||
    header.startsWith('Qk')
  );
};

/**
 * @param fileId gets the unique file ID
 * @param filename maintains the original filename
 * @returns Local file if something fucks up.
 */
export async function fileDownloads(
  fileId: string,
  filename: string,
  options: FileDownloadOptions = {},
): Promise<string> {
  const assetsDir = FileSystem.cacheDirectory + 'assets/';
  const uniqueFilename = getSafeAssetFilename(fileId, filename);
  const localPath = assetsDir + uniqueFilename;
  const metadataPath = `${localPath}.metadata.json`;

  try {
    const BASE_URL = getBaseUrl();

    const baseUrlClean = BASE_URL.endsWith('/')
      ? BASE_URL.slice(0, -1)
      : BASE_URL;

    const downloadUrl = `${baseUrlClean}/file/download?id=${fileId}`;
    const dirInfo = await FileSystem.getInfoAsync(assetsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });
    }

    if (await isCachedFileFresh(localPath, metadataPath, options)) {
      return toFileUri(localPath);
    }

    const token = await getToken();
    const authHeaders = token ? { Authorization: `Token ${token}` } : {};
    const temporaryPath = `${localPath}.download`;

    await FileSystem.deleteAsync(temporaryPath, { idempotent: true });

    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      temporaryPath,
      {
        headers: {
          Accept: options.contentType || 'image/*',
          ...authHeaders,
        },
      },
    );
    // FileSystem.downloadAsync returns the file:// URI directly if successful but dont't touch please.

    const {
      uri: downloadedFileUri,
      status,
      headers,
      mimeType,
    } = downloadResult;
    const responseContentType =
      getHeader(headers, 'content-type') ?? mimeType ?? options.contentType;
    const downloadedFileInfo = await FileSystem.getInfoAsync(downloadedFileUri);
    if (
      status < 200 ||
      status >= 300 ||
      !isImageContentType(responseContentType) ||
      !downloadedFileInfo.exists ||
      !('size' in downloadedFileInfo) ||
      downloadedFileInfo.size === undefined ||
      downloadedFileInfo.size <= MIN_IMAGE_FILE_SIZE_BYTES ||
      !(await hasImageSignature(downloadedFileUri, responseContentType))
    ) {
      await FileSystem.deleteAsync(downloadedFileUri, { idempotent: true });
      return (await isCachedFileFresh(localPath, metadataPath, {}))
        ? toFileUri(localPath)
        : '';
    }

    await FileSystem.deleteAsync(localPath, { idempotent: true });
    await FileSystem.moveAsync({ from: downloadedFileUri, to: localPath });
    const metadata: CachedAssetMetadata = { size: downloadedFileInfo.size };
    if (responseContentType) metadata.contentType = responseContentType;
    if (options.version) metadata.version = options.version;
    await writeCachedMetadata(metadataPath, metadata);

    return toFileUri(localPath);
  } catch (error) {
    return (await isCachedFileFresh(localPath, metadataPath, {}))
      ? toFileUri(localPath)
      : '';
  }
}
