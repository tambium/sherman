import { Clock } from "../types/clock";

/**
 * Handles update of `Clock` on receipt of event.
 * @param localClock `Clock` instance for receiving node.
 * @param now Physical time (wall clock) on receiving node.
 * @param remoteClock `Clock` instance for node that sent event.
 */
export const receive = ({
  localClock,
  now,
  remoteClock,
}: {
  localClock: Clock;
  now: number;
  remoteClock: Clock;
}): Clock => {
  if (localClock.logical < now && remoteClock.logical < now) {
    return { ...localClock, counter: 0, logical: now };
  }

  if (localClock.logical === remoteClock.logical) {
    return {
      ...localClock,
      counter: Math.max(localClock.counter, remoteClock.counter) + 1,
    };
  } else if (remoteClock.logical < localClock.logical) {
    return { ...localClock, counter: localClock.counter + 1 };
  } else {
    return {
      ...localClock,
      counter: remoteClock.counter + 1,
      logical: remoteClock.logical,
    };
  }
};
