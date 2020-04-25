import { Clock } from "../.";

export const handleReceivedEvent = ({
  localClock,
  now,
  remoteClock,
}: {
  localClock: Clock;
  now: number;
  remoteClock: Clock;
}): Clock => {
  if (localClock.timestamp < now && remoteClock.timestamp < now) {
    return { ...localClock, count: 0, timestamp: now };
  }

  if (localClock.timestamp === remoteClock.timestamp) {
    return {
      ...localClock,
      count: Math.max(localClock.count, remoteClock.count) + 1,
    };
  } else if (remoteClock.timestamp < localClock.timestamp) {
    return { ...localClock, count: localClock.count + 1 };
  } else {
    return {
      ...localClock,
      count: remoteClock.count + 1,
      timestamp: remoteClock.timestamp,
    };
  }
};
