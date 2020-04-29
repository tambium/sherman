import { Clock } from "../types/clock";

/**
 * Handles update of `Clock` upon sending an event.
 * @param localClock `Clock` instance for sending node.
 * @param now Physical time (wall clock) on sending node.
 */
export const send = ({
  localClock,
  now,
}: {
  localClock: Clock;
  now: number;
}): Clock => {
  if (localClock.logical < now) {
    return {
      counter: 0,
      logical: now,
      nodeId: localClock.nodeId,
    };
  }

  return { ...localClock, counter: localClock.counter + 1 };
};
