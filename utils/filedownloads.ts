import * as FileSystem from 'expo-file-system/legacy';

import { getBaseUrl, getToken } from '.';

const MIN_VALID_FILE_SIZE_BYTES = 100;
const JSON_CONTENT_TYPE = 'application/json';
const ASSETS_SUBDIRECTORY = 'assets/';
let assetsDirectoryReady: Promise<string> | null = null;

const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const isServerErrorPayload = (
  status: number,
  headers: FileSystem.FileSystemHttpResult['headers'] | undefined,
): boolean => {
  if (status < 200 || status >= 300) {
    return true;
  }

  const contentType =
    headers?.['Content-Type'] ??
    headers?.['content-type'] ??
    headers?.['CONTENT-TYPE'];

  return (
    typeof contentType === 'string' && contentType.includes(JSON_CONTENT_TYPE)
  );
};

const ensureAssetsDirectory = async (): Promise<string> => {
  if (assetsDirectoryReady) {
    return assetsDirectoryReady;
  }

  assetsDirectoryReady = (async () => {
    const assetsDirectory = `${FileSystem.documentDirectory}${ASSETS_SUBDIRECTORY}`;
    const directoryInfo = await FileSystem.getInfoAsync(assetsDirectory);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(assetsDirectory, {
        intermediates: true,
      });
    }
    return assetsDirectory;
  })();

  return assetsDirectoryReady;
};

interface FileDownloadOptions {
  token?: string | null;
  baseUrl?: string;
}

/**
 * @param fileId gets the unique file ID
 * @param filename maintains the original filename
 * @returns Local file if something fucks up.
 */
export async function fileDownloads(
  fileId: string,
  filename: string,
  options?: FileDownloadOptions,
): Promise<string> {
  try {
    const baseUrl = options?.baseUrl ?? getBaseUrl();

    const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    const downloadUrl = `${baseUrlClean}/file/download?id=${fileId}`;
    const assetsDir = await ensureAssetsDirectory();
    const localPath = `${assetsDir}${fileId}_${sanitizeFilename(filename)}`;

    const existingFileInfo = await FileSystem.getInfoAsync(localPath);
    if (
      existingFileInfo.exists &&
      existingFileInfo.size &&
      existingFileInfo.size > MIN_VALID_FILE_SIZE_BYTES
    ) {
      return localPath;
    }

    const token = options?.token ?? (await getToken());
    const authHeaders = token ? { Authorization: `Token ${token}` } : {};

    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      localPath,
      {
        headers: {
          Accept: '*/*',
          ...authHeaders,
        },
      },
    );

    if (isServerErrorPayload(downloadResult.status, downloadResult.headers)) {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      return '';
    }

    const downloadedFileInfo = await FileSystem.getInfoAsync(
      downloadResult.uri,
    );
    if (
      !downloadedFileInfo.exists ||
      (downloadedFileInfo.exists &&
        downloadedFileInfo.size !== undefined &&
        downloadedFileInfo.size < MIN_VALID_FILE_SIZE_BYTES)
    ) {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      return '';
    }

    return downloadResult.uri;
  } catch (error) {
    console.warn(
      `Failed to download dictionary asset "${filename}" (${fileId}).`,
      error,
    );
    return '';
  }
}
