import * as FileSystem from 'expo-file-system';

/**
 * This utility function here downloads the translation remote files
 * and saves it locally, it then returns the local URI.
 * Ensures unique filenames and handles errors gracefully.
 * @param remoteUrl URL of the file to download
 * @param filename Desired local file name (with extension)
 * @returns Full local file URI or a fallback URI if the download fails
 */
export async function fileDownloads(
  remoteUrl: string,
  filename: string,
): Promise<string> {
  try {
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
    const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri);
    console.log(`File downloaded successfully: ${uri}`);
    return uri;
  } catch (error) {
    console.error(`Error downloading ${filename} from ${remoteUrl}:`, error);

    return '';
  }
}
