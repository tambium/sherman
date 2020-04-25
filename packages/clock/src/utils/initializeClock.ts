import { Clock } from "../.";

export const initializeClock = ({
  nodeId,
  now,
}: {
  nodeId: string;
  now: number;
}): Clock => ({
  count: 0,
  nodeId,
  timestamp: now,
});
