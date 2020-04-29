import { IEvent } from "../../components/event";
import { compare } from "../../../../../packages/clock";

export const compareEvents = (first: IEvent, second: IEvent): number => {
  return compare(first.clock, second.clock);
};
