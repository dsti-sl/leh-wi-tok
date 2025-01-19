// UTILITIES METHODS

import { Record } from '@/lib/types';

/**
 * @param arrStrings
 * @returns
 */
export const parseArrayStringsToSelectableObjects = (arrStrings: string[]) =>
  arrStrings.reduce(
    (acc: Record[], val: string, curIndex: number) => [
      ...acc,
      { key: curIndex + 1, label: val, value: val },
    ],
    [],
  );

export const parseArrayObjectToSelectables = (
  arrObjects: Record[],
  labelKey: string,
  valueKey: string,
) =>
  arrObjects.reduce(
    (acc: Record[], val, curIndex: number) => [
      ...acc,
      { key: curIndex + 1, label: val[labelKey], value: val[valueKey] },
    ],
    [],
  );
