/** Fecha en formato AAAA-MM-DD */
export type ISODate = string;

/**
 * Datos de entrada que llegan desde afuera (HTTP, agente). Se validan en el
 * constructor de cada entidad, por eso aquí todo es `unknown`.
 */
export type Untrusted<T> = { [K in keyof T]?: unknown };
