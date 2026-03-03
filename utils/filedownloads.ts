import * as FileSystem from 'expo-file-system';

import { getToken } from '.';

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
    // TODO: @vidallisk read var from expo constant
    const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
    if (!BASE_URL) {
      throw new Error('BASE_URL is not defined in .env!');
    }

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

    const { uri: downloadedFileUri } = await FileSystem.downloadAsync(
      downloadUrl,
      localPath,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: token ? `Token ${token}` : '',
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
