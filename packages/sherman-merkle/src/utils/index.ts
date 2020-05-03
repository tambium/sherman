import { Clock, hash as clockHash, pack } from "@tambium/sherman-clock";

const insertKey = (trie: number, key: string, hash: number) => {
  if (key.length === 0) return trie;
  const c = key[0];
};

export const insert = ({
  clock,
  trie,
}: {
  clock: Clock;
  trie: { hash: number };
}) => {
  const toBase3 = (unix: number): string => {
    return ((unix / 1000 / 60) | 0).toString(3);
  };

  const hash = clockHash(clock);
  const key = toBase3(clock.logical);

  trie = Object.assign({}, trie, { hash: trie.hash ^ hash });
  return insertKey(trie, key, hash);
};
