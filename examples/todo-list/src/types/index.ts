import { Clock } from "../../../../packages/clock";

export interface IMessage {
  column: string;
  table: string;
  row: string;
  timestamp: Clock;
  value: string;
}

export interface IRow {
  [key: string]: any;
}

export interface ITodo {
  id: string;
  title: string;
  tombstone?: number;
}

export interface IHostedDB {
  messages: IMessage[];
}

export interface ILocalDB extends IHostedDB {
  tables: {
    [key: string]: IRow[];
    todos: ITodo[];
  };
}
