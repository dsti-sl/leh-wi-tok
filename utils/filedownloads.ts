import * as FileSystem from 'expo-file-system';

import { getBaseUrl, getToken } from '.';

/**
 * @param fileId gets the unique file ID
 * @param filename maintains the original filename
 * @returns Local file if something fucks up.
 */
export async function fileDownloads(
  fileId: string,
  filename: string,
): Promise<string> {
  try {
    const BASE_URL = getBaseUrl();

    const baseUrlClean = BASE_URL.endsWith('/')
      ? BASE_URL.slice(0, -1)
      : BASE_URL;

    const downloadUrl = `${baseUrlClean}/file/download?id=${fileId}`;
    const assetsDir = FileSystem.documentDirectory + 'assets/';
    const uniqueFilename = `${Date.now()}_${filename}`;
    const localPath = assetsDir + uniqueFilename;

    const dirInfo = await FileSystem.getInfoAsync(assetsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });
    }
    const existingFileInfo = await FileSystem.getInfoAsync(localPath);
    if (
      existingFileInfo.exists &&
      existingFileInfo.size &&
      existingFileInfo.size > 100 // Minimal size check to avoid empty/error files
    ) {
      return `file://${localPath}`;
    }

    const token = await getToken();
    const authHeaders = token ? { Authorization: `Token ${token}` } : {};

    const { uri: downloadedFileUri } = await FileSystem.downloadAsync(
      downloadUrl,
      localPath,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...authHeaders,
        },
      },
    );
    // FileSystem.downloadAsync returns the file:// URI directly if successful but dont't touch please.

    const downloadedFileInfo = await FileSystem.getInfoAsync(downloadedFileUri);
    if (
      !downloadedFileInfo.exists ||
      (downloadedFileInfo.exists &&
        downloadedFileInfo.size !== undefined &&
        downloadedFileInfo.size < 100)
    ) {
      await FileSystem.deleteAsync(downloadedFileUri, { idempotent: true });
      return '';
    }

    return downloadedFileUri;
  } catch (error) {
    return '';
  }
}
