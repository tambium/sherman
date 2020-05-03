import { IEvent } from "../../components/event";
import { compare } from "../../../../../packages/sherman-clock";

export const compareEvents = (first: IEvent, second: IEvent): number => {
  return compare(first.clock, second.clock);
};
