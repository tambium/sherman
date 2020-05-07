import { Clock, hash as clockHash } from "@tambium/sherman-clock";
import { IMerkle } from "../types";
import { insertKey } from "./insertKey";

export const insert = ({ clock, trie }: { clock: Clock; trie: IMerkle }) => {
  const toBase3 = (unix: number): string => {
    return ((unix / 1000 / 60) | 0).toString(3);
  };

  const hash = clockHash(clock);
  const key = toBase3(clock.logical);

  trie = Object.assign({}, trie, { hash: trie.hash! ^ hash });

  return insertKey(trie, key, hash);
};
