import { Clock } from "../types/clock";

/**
 * Comparison function used to determine order of events in system.
 * @param first First `Clock` instance
 * @param second Second `Clock` instance
 */
export const compare = (first: Clock, second: Clock): number => {
  if (first.logical === second.logical) {
    if (first.counter === second.counter) {
      if (first.nodeId === second.nodeId) return 0;
      return first.nodeId < second.nodeId ? -1 : 1;
    }
    return first.counter - second.counter;
  }
  return first.logical - second.logical;
};
