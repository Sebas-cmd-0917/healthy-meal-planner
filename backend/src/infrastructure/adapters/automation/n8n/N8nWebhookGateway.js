/**
 * Envía eventos a un webhook de n8n: POST {baseUrl}/{evento}
 * Ej: recipe.created -> http://localhost:5678/webhook/recipe-created
 *
 * @implements {import('../../../../application/ports/AutomationGateway.js').AutomationGateway}
 */
export class N8nWebhookGateway {
  constructor({ webhookBaseUrl, webhookSecret, timeoutMs = 5000 }) {
    this.baseUrl = webhookBaseUrl?.replace(/\/$/, '') ?? null;
    this.secret = webhookSecret;
    this.timeoutMs = timeoutMs;
  }

  async publish(event, payload) {
    if (!this.baseUrl) return; // n8n no configurado: no hace nada

    const path = event.replace(/\./g, '-');
    const headers = { 'Content-Type': 'application/json' };
    if (this.secret) headers['X-Webhook-Secret'] = this.secret;

    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event, payload, sentAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new Error(`n8n respondió ${res.status} para ${event}`);
  }
}
