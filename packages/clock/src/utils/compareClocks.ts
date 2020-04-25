import { Clock } from "../.";

export const compareClocks = (first: Clock, second: Clock): number => {
  if (first.timestamp === second.timestamp) {
    if (first.count === second.count) {
      if (first.nodeId === second.nodeId) return 0;
      return first.nodeId < second.nodeId ? -1 : 1;
    }
    return first.count - second.count;
  }
  return first.timestamp - second.timestamp;
};
