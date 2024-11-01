export type Record = {
  [key: string]: string | number | boolean | Record | Record[] | null;
};
