import { IMerkle } from "../types";

export const insertKey = (
  trie: IMerkle,
  key: string,
  hash: number
): IMerkle => {
  if (key.length === 0) return trie;
  const c: string = key[0];
  const n: IMerkle = (trie[c] || {}) as IMerkle;
  return Object.assign({}, trie, {
    [c]: Object.assign({}, n, insertKey(n, key.slice(1), hash), {
      hash: n.hash! ^ hash,
    }),
  });
};
