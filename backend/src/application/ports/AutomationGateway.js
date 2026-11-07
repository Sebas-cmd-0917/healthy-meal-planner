/**
 * Puerto de salida para disparar automatizaciones externas (n8n).
 * El caso de uso solo publica un evento; el adaptador decide cómo enviarlo.
 *
 * @typedef {Object} AutomationGateway
 * @property {(event: string, payload: object) => Promise<void>} publish
 */
export {};
