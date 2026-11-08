/**
 * Puerto de salida para disparar automatizaciones externas (n8n).
 * El caso de uso solo publica un evento; el adaptador decide cómo enviarlo.
 */
export interface AutomationGateway {
  publish(event: string, payload: unknown): Promise<void>;
}
