export interface IMerkle {
  hash?: number;
  [key: string]: IMerkle | number | undefined;
}
