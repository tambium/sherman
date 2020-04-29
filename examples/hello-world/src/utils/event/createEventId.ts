import { Clock } from "../../../../../packages/clock";

export const createEventId = (clock: Clock, nodeId: string): string => {
  const pad = (initialValue: number, targetLength: number): string => {
    const stringified = String(initialValue);
    return stringified.padStart(targetLength, "0");
  };

  return `${pad(clock.logical, 3)}:${pad(clock.counter, 3)}:${nodeId}`;
};
