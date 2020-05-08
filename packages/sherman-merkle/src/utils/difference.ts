import { IMerkle } from "../types";

const getKeys = (trie: IMerkle): string[] => {
  return Object.keys(trie).filter((x: string) => x !== "hash");
};

const keyToTimestamp = (key: string): number => {
  // 16 is the length of the base 3 value of the current time in
  // minutes. Ensure it's padded to create the full value
  const fullKey: string = key + "0".repeat(16 - key.length);

  // Parse the base 3 representation
  return parseInt(fullKey, 3) * 1000 * 60;
};

export const difference = (trie1: IMerkle, trie2: IMerkle): number | null => {
  if (trie1.hash === trie2.hash) return null;

  let node1 = trie1;
  let node2 = trie2;
  let k = "";

  while (1) {
    const keyset: Set<string> = new Set<string>([
      ...getKeys(node1),
      ...getKeys(node2),
    ]);
    const keys: string[] = [...keyset.values()];
    keys.sort();

    const diffkey: string | undefined = keys.find((key: string) => {
      const next1: IMerkle = (node1[key] || {}) as IMerkle;
      const next2: IMerkle = (node2[key] || {}) as IMerkle;
      return next1.hash !== next2.hash;
    });

    if (!diffkey) {
      return keyToTimestamp(k);
    }

    k += diffkey;
    node1 = (node1[diffkey] || {}) as IMerkle;
    node2 = (node2[diffkey] || {}) as IMerkle;
  }

  return null;
};
