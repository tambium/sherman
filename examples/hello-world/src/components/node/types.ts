import { Clock } from "~../../../packages/clock/dist";
import { IEvent } from "~components/event";

export interface INode {
  clock: Clock;
  events: Array<IEvent>;
  nodeId: string;
}
