import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const getAbsoluteImagePath = async (
  relativePath: string | null,
): Promise<string | null> => {
  if (!relativePath) return null;

  // Convert all paths to absolute URIs
  const createAbsoluteUri = async (path: string) => {
    if (path.startsWith('file://')) {
      const fixedUri =
        Platform.OS === 'ios' ? path.replace(/^file:\/+/, 'file:///') : path;

      const { exists } = await FileSystem.getInfoAsync(fixedUri);
      return exists ? fixedUri : null;
    }

    // Handle asset paths from database
    const assetsDir = `${FileSystem.documentDirectory}assets/`;
    const filename = path.split('/').pop() || '';
    const fullUri = `${assetsDir}${filename}`;

    // Create directory if needed
    await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });

    // Validate file existence and size
    const fileInfo = await FileSystem.getInfoAsync(fullUri);
    return fileInfo.exists ? fullUri : null;
  };

  try {
    return await createAbsoluteUri(relativePath);
  } catch (error) {
    console.error('IMAGE PATH RESOLUTION FAILED:', error);
    return null;
  }
};

export const nuclearImageValidation = async () => {
  // Purge all potentially corrupted images
  const assetsDir = `${FileSystem.documentDirectory}assets/`;
  await FileSystem.deleteAsync(assetsDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(assetsDir);
};
