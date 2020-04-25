import { Clock } from "../.";

export const handleSendEvent = ({
  localClock,
  now,
}: {
  localClock: Clock;
  now: number;
}): Clock => {
  if (localClock.timestamp < now) {
    return {
      count: 0,
      nodeId: localClock.nodeId,
      timestamp: now,
    };
  }

  return { ...localClock, count: localClock.count + 1 };
};
