import { Clock } from "~../../../packages/clock/dist";

export interface IEvent {
  eventId: string;
  clock: Clock;
}
