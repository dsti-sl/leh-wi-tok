import * as FileSystem from 'expo-file-system';

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
      console.log(`[fileDownloads] Creating assets directory: ${assetsDir}`);
      await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });
    }
    const existingFileInfo = await FileSystem.getInfoAsync(localPath);
    if (
      existingFileInfo.exists &&
      existingFileInfo.size &&
      existingFileInfo.size > 100 // Minimal size check to avoid empty/error files
    ) {
      console.log(`[fileDownloads] File already exists locally: ${localPath}`);
      return `file://${localPath}`;
    }

    console.log(
      `[fileDownloads] Attempting to download from ${downloadUrl} to ${localPath}`,
    );
    const { uri: downloadedFileUri } = await FileSystem.downloadAsync(
      downloadUrl,
      localPath,
    );
    // FileSystem.downloadAsync returns the file:// URI directly if successful but dont't touch please.

    console.log(`[fileDownloads] File downloaded to: ${downloadedFileUri}`);

    const downloadedFileInfo = await FileSystem.getInfoAsync(downloadedFileUri);
    if (
      !downloadedFileInfo.exists ||
      (downloadedFileInfo.exists &&
        downloadedFileInfo.size !== undefined &&
        downloadedFileInfo.size < 100)
    ) {
      const sizeInfo =
        downloadedFileInfo.exists && typeof downloadedFileInfo.size === 'number'
          ? downloadedFileInfo.size
          : 'N/A';
      console.warn(
        `[fileDownloads] Downloaded file seems invalid for ID ${fileId} (size: ${sizeInfo})`,
      );
      await FileSystem.deleteAsync(downloadedFileUri, { idempotent: true });
      return '';
    }

    try {
      const snippet = await FileSystem.readAsStringAsync(downloadedFileUri, {
        encoding: FileSystem.EncodingType.Base64,
        length: 40,
      });
      console.log(
        '[fileDownloads] Base64 start of file (first 10 chars):',
        snippet.slice(0, 10),
      );
    } catch (readError) {
      console.warn(
        '[fileDownloads] Could not read file snippet for debug:',
        readError,
      );
    }

    return downloadedFileUri;
  } catch (error) {
    console.error(
      `[fileDownloads] Error downloading file ID ${fileId}, filename ${filename}:`,
      error,
    );
    return '';
  }
}
