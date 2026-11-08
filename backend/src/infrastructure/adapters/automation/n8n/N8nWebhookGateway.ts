import type { AutomationGateway } from '../../../../application/ports/AutomationGateway.js';

/**
 * Envía eventos a un webhook de n8n: POST {baseUrl}/{evento}
 * Ej: recipe.created -> http://localhost:5678/webhook/recipe-created
 */
export class N8nWebhookGateway implements AutomationGateway {
  private readonly baseUrl: string | null;
  private readonly secret: string | null;
  private readonly timeoutMs: number;

  constructor({ webhookBaseUrl, webhookSecret, timeoutMs = 5000 }: { webhookBaseUrl: string | null; webhookSecret: string | null; timeoutMs?: number }) {
    this.baseUrl = webhookBaseUrl?.replace(/\/$/, '') ?? null;
    this.secret = webhookSecret;
    this.timeoutMs = timeoutMs;
  }

  async publish(event: string, payload: unknown): Promise<void> {
    if (!this.baseUrl) return; // n8n no configurado: no hace nada

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.secret) headers['X-Webhook-Secret'] = this.secret;

    const res = await fetch(`${this.baseUrl}/${event.replace(/\./g, '-')}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, payload, sentAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new Error(`n8n respondió ${res.status} para ${event}`);
  }
}
