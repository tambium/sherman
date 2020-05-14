import {
  HOSTED_DB,
  HOSTED_MESSAGES_MERKLES,
  HOSTED_MESSAGES,
  LOCAL_DB,
  LOCAL_MESSAGES,
  LOCAL_TABLES,
  LOCAL_TODOS,
} from "../constants";

export const stringify = (obj: object): string => {
  return JSON.stringify(obj);
};

export const parse = (str: string): object => {
  return JSON.parse(str);
};

export const getter = (item: string): any => {
  return parse(localStorage.getItem(item) || "{}");
};

export const setter = (item: string, obj: object): void => {
  return localStorage.setItem(item, stringify(obj));
};

export const hasItem = (item: string): boolean => {
  return localStorage.hasOwnProperty(item);
};

export const getHostedDB = () => getter(HOSTED_DB);

export const getHostedDBMessages = () => getHostedDB()[HOSTED_MESSAGES];

export const getHostedDBMessagesMerkles = () =>
  getHostedDB()[HOSTED_MESSAGES_MERKLES];

export const constructLocalDB = (nodeId: string): string => {
  return `${LOCAL_DB}${nodeId}`;
};

export const getLocalDB = (nodeId: string) => {
  const localDB = constructLocalDB(nodeId);
  return getter(localDB);
};

export const getLocalDBTables = (nodeId: string) =>
  getLocalDB(nodeId)[LOCAL_TABLES];

export const getLocalDBMessages = (nodeId: string) =>
  getLocalDB(nodeId)[LOCAL_MESSAGES];

export const getLocalDBTodos = (nodeId: string) =>
  getLocalDBTables(nodeId)[LOCAL_TODOS];
