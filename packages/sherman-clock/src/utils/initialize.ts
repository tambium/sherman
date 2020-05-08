import { Clock } from "../types/clock";

/**
 * Handle the initialization of HLC.
 * @param nodeId Identifier for node in system.
 * @param now Physical time (wall clock) on node.
 */
export const initialize = ({
  nodeId,
  now,
}: {
  nodeId: string;
  now: number;
}): Clock => ({
  counter: 0,
  logical: now,
  nodeId,
});
