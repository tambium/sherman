import { IMerkle } from "../../../../packages/sherman-merkle";

export interface IMessage {
  column: string;
  table: string;
  row: string;
  timestamp: string;
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

export interface IMerkleEntity {
  groupId: string;
  merkle: string;
}

export interface IHostedDB {
  messages: IMessage[];
  messagesMerkles: IMerkleEntity[];
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
  merkle: IMerkle;
  messages: IMessage[];
}

export interface ISyncData {
  groupId?: string;
  clientId?: string;
  messages: IMessage[];
  merkle: IMerkle;
}

export interface ISyncResponse {
  status: string;
  reason?: string;
  data: ISyncData;
}
