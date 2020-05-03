import { Clock } from "../../../../packages/sherman-clock";

export interface IMessage {
  column: string;
  groupId: string;
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

export interface IMerkle {
  hash: number;
}

export interface IMessageMerkle {
  groupId: string;
  merkle: string;
}

export interface IHostedDB {
  messages: IMessage[];
  messagesMerkles: IMessageMerkle[];
}

export interface ILocalDB {
  messages: IMessage[];
  tables: {
    [key: string]: IRow[];
    todos: ITodo[];
  };
}

export interface ISyncOptions {
  clientId: string;
  groupId: string;
  merkle: string;
  messages: IMessage[];
}
