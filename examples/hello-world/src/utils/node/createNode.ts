import { initialize } from "../../../../../packages/clock";
import { INode } from "../../components/node";
import { createEventId } from "../../utils/event";

export const createNode = (nodeId: string, now: number): INode => {
  let clock = initialize({ nodeId, now });
  return {
    clock,
    events: [
      {
        clock,
        eventId: createEventId(clock, nodeId),
      },
    ],
    nodeId,
  };
};
