import React from "react";
import { IEvent } from "./types";

interface EventProps {
  event: IEvent;
}

export const Event: React.FC<EventProps> = ({ event }) => {
  return <div>{event.eventId}</div>;
};
