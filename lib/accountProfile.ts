import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizePhoneNumber } from '@/utils';

type ApiCollectionResponse<T> = {
  data?: T[];
  errors?: { detail?: string; title?: string }[];
  meta?: { message?: string };
};

type AccountApiUser = {
  createdAt: string;
  generalUser?: boolean;
  handle: string;
  id: string;
  name: string;
  parent?: boolean;
  pictureId: string | null;
  student?: boolean;
  superuser?: boolean;
  superviewer?: boolean;
  teacher?: boolean;
  verified?: boolean;
  volunteer?: boolean;
};

type ContactRecord = {
  address?: string;
  id: string;
  number?: string;
  priority?: number | null;
  verified?: boolean;
};

export interface AccountUserInfo {
  address: string | null;
  addressId: string | null;
  addressVerified: boolean;
  createdAt: string;
  generalUser: boolean;
  handle: string;
  id: string;
  name: string;
  parent: boolean;
  phoneId: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  pictureId: string | null;
  student: boolean;
  superuser: boolean;
  superviewer: boolean;
  teacher: boolean;
  verified: boolean;
  volunteer: boolean;
}

const buildAuthHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Token ${token}` } : {}),
});

const getErrorMessage = (payload: ApiCollectionResponse<unknown>) =>
  payload.errors?.[0]?.detail ||
  payload.meta?.message ||
  payload.errors?.[0]?.title ||
  'Request failed.';

async function fetchCollection<T>(
  url: string,
  token: string | null,
): Promise<T[]> {
  const response = await fetch(url, {
    headers: buildAuthHeaders(token),
  });
  const payload: ApiCollectionResponse<T> = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload.data ?? [];
}

async function fetchOptionalCollection<T>(
  url: string,
  token: string | null,
): Promise<T[]> {
  try {
    return await fetchCollection<T>(url, token);
  } catch (error) {
    console.warn(`Optional account request failed for ${url}:`, error);
    return [];
  }
}

export const getAuthorizedHeaders = (token: string | null) => ({
  ...(token ? { Authorization: `Token ${token}` } : {}),
});

export const formatHandle = (handle?: string | null) => {
  if (!handle) return 'Not added yet';
  return handle.startsWith('@') ? handle : `@${handle}`;
};

export const formatPhoneForDisplay = (phone?: string | null) => {
  if (!phone) return 'Not added yet';

  const digits = phone.replace(/\D/g, '');
  if (
    digits.startsWith('232') &&
    (digits.length === 11 || digits.length === 12)
  ) {
    const localNumber = digits.slice(3);
    if (localNumber.length === 8) {
      return `+232 ${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5)}`;
    }

    if (localNumber.length === 9) {
      return `+232 ${localNumber.slice(0, 2)} ${localNumber.slice(2, 6)} ${localNumber.slice(6)}`;
    }
  }

  return phone;
};

export const getUserTypeLabel = (userInfo: Partial<AccountUserInfo> | null) => {
  if (!userInfo) return 'Member';

  const roles = [
    userInfo.student ? 'Student' : null,
    userInfo.parent ? 'Parent' : null,
    userInfo.volunteer ? 'Volunteer' : null,
    userInfo.teacher ? 'Teacher' : null,
    userInfo.generalUser ? 'Member' : null,
  ].filter(Boolean);

  return roles.length ? roles.join(' • ') : 'Member';
};

export const getProfileVerificationStatus = (
  userInfo: Partial<AccountUserInfo> | null,
) =>
  Boolean(
    userInfo?.verified || userInfo?.phoneVerified || userInfo?.addressVerified,
  );

export async function fetchAuthenticatedUser(
  baseUrl: string,
  token: string | null,
): Promise<AccountApiUser> {
  const response = await fetch(`${baseUrl}/user/me`, {
    headers: buildAuthHeaders(token),
  });
  const payload: ApiCollectionResponse<AccountApiUser> = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  const user = payload.data?.[0];
  if (!user) {
    throw new Error('Unable to load your account profile.');
  }

  return user;
}

export async function fetchAccountProfile(
  baseUrl: string,
  token: string | null,
  userId: string,
): Promise<AccountUserInfo> {
  const [user, phones, addresses] = await Promise.all([
    fetchAuthenticatedUser(baseUrl, token),
    fetchOptionalCollection<ContactRecord>(
      `${baseUrl}/phone?select=id,number,verified,priority&order=priority&page-size=1`,
      token,
    ),
    fetchOptionalCollection<ContactRecord>(
      `${baseUrl}/address?select=id,address,verified,priority&order=priority&page-size=1`,
      token,
    ),
  ]);
  if (user.id !== userId) {
    throw new Error('Authenticated user mismatch while loading account.');
  }

  const phone = phones[0];
  const address = addresses[0];

  return {
    address: address?.address?.trim() || null,
    addressId: address?.id ?? null,
    addressVerified: Boolean(address?.verified),
    createdAt: user.createdAt,
    generalUser: Boolean(user.generalUser),
    handle: user.handle ?? '',
    id: user.id,
    name: user.name ?? '',
    parent: Boolean(user.parent),
    phoneId: phone?.id ?? null,
    phoneNumber: phone?.number ?? null,
    phoneVerified: Boolean(phone?.verified),
    pictureId: user.pictureId ?? null,
    student: Boolean(user.student),
    superuser: Boolean(user.superuser),
    superviewer: Boolean(user.superviewer),
    teacher: Boolean(user.teacher),
    verified: Boolean(user.verified),
    volunteer: Boolean(user.volunteer),
  };
}

export async function fetchCurrentAccountProfile(
  baseUrl: string,
  token: string | null,
): Promise<AccountUserInfo> {
  const currentUser = await fetchAuthenticatedUser(baseUrl, token);
  const [phones, addresses] = await Promise.all([
    fetchOptionalCollection<ContactRecord>(
      `${baseUrl}/phone?select=id,number,verified,priority&order=priority&page-size=1`,
      token,
    ),
    fetchOptionalCollection<ContactRecord>(
      `${baseUrl}/address?select=id,address,verified,priority&order=priority&page-size=1`,
      token,
    ),
  ]);

  const phone = phones[0];
  const address = addresses[0];

  return {
    address: address?.address?.trim() || null,
    addressId: address?.id ?? null,
    addressVerified: Boolean(address?.verified),
    createdAt: currentUser.createdAt,
    generalUser: Boolean(currentUser.generalUser),
    handle: currentUser.handle ?? '',
    id: currentUser.id,
    name: currentUser.name ?? '',
    parent: Boolean(currentUser.parent),
    phoneId: phone?.id ?? null,
    phoneNumber: phone?.number ?? null,
    phoneVerified: Boolean(phone?.verified),
    pictureId: currentUser.pictureId ?? null,
    student: Boolean(currentUser.student),
    superuser: Boolean(currentUser.superuser),
    superviewer: Boolean(currentUser.superviewer),
    teacher: Boolean(currentUser.teacher),
    verified: Boolean(currentUser.verified),
    volunteer: Boolean(currentUser.volunteer),
  };
}

export async function hydrateCurrentAccountProfile(
  baseUrl: string,
  token: string | null,
): Promise<AccountUserInfo> {
  const profile = await fetchCurrentAccountProfile(baseUrl, token);
  await storeAccountProfile(profile);
  return profile;
}

export async function storeAccountProfile(userInfo: AccountUserInfo) {
  await AsyncStorage.setItem('user', JSON.stringify(userInfo));
}

export const normalizeEditablePhoneNumber = (phoneNumber: string) => {
  const trimmedPhone = phoneNumber.trim();
  if (!trimmedPhone) return '';
  return normalizePhoneNumber(trimmedPhone);
};

export async function uploadProfileImage(
  baseUrl: string,
  token: string | null,
  file: {
    fileName?: string | null;
    mimeType?: string | null;
    uri: string;
  },
) {
  const formData = new FormData();
  formData.append('file', {
    name: file.fileName ?? `profile-${Date.now()}.jpg`,
    type: file.mimeType ?? 'image/jpeg',
    uri: file.uri,
  } as unknown as Blob);

  const response = await fetch(`${baseUrl}/file/upload`, {
    method: 'POST',
    headers: getAuthorizedHeaders(token),
    body: formData,
  });

  const payload: ApiCollectionResponse<{ id: string; name?: string }> =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  const fileId = payload.data?.[0]?.id;
  if (!fileId) {
    throw new Error('Profile image upload failed.');
  }

  return fileId;
}
