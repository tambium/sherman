import { Clock } from "../../../../../packages/sherman-clock";
import { IEvent } from "../../components/event";

export interface INode {
  clock: Clock;
  events: Array<IEvent>;
  nodeId: string;
}
