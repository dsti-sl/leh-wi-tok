import * as FileSystem from 'expo-file-system';

/**
 * This utility function here downloads the translation remote files
 * and saves it locally, it then returns the local URI.
 * Ensures unique filenames and handles errors gracefully.
 * @param fileId The ID of the file to download
 * @param filename Desired local file name (with extension)
 * @returns Full local file URI or a fallback URI if the download fails
 */
export async function fileDownloads(
  fileId: string,
  filename: string,
): Promise<string> {
  try {
    const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
    if (!BASE_URL) {
      throw new Error('BASE_URL is not defined.');
    }

    const downloadUrl = `${BASE_URL}/file/download?id=${fileId}`; // Construct the download URL
    const assetsDir = FileSystem.documentDirectory + 'assets/';
    const uniqueFilename = `${Date.now()}_${filename}`;
    const localUri = assetsDir + uniqueFilename;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(assetsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });
    }

    // this prevents duplications of files
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log(`File already exists: ${localUri}`);
      return localUri;
    }

    // Download and return path
    const { uri } = await FileSystem.downloadAsync(downloadUrl, localUri);
    console.log(`File downloaded successfully: ${uri}`);
    return uri;
  } catch (error) {
    console.error(
      `Error downloading ${filename} from file ID ${fileId}:`,
      error,
    );

    return '';
  }
}
