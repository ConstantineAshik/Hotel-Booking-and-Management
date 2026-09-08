/** Contracts only. A provider must pass integration tests before it can be enabled. */
export interface PaymentProvider {
  readonly key: string;
  createCheckout(input: {
    bookingId: string; amountMinor: bigint; currency: string;
    idempotencyKey: string; returnUrl: string; expiresAt: Date;
  }): Promise<{ externalId: string; checkoutUrl: string }>;
  verifyWebhook(rawBody: Uint8Array, headers: Readonly<Record<string, string>>): Promise<{
    eventId: string; externalId: string; amountMinor: bigint; currency: string;
    status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  }>;
  refund(input: { externalId: string; amountMinor: bigint; idempotencyKey: string }): Promise<{ externalId: string }>;
}

export interface EmailProvider {
  send(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<{ messageId: string }>;
}

export interface ObjectStorage {
  put(input: { key: string; body: Uint8Array; contentType: string }): Promise<void>;
  delete(key: string): Promise<void>;
  signedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
}

export interface ChannelAdapter {
  readonly key: string;
  publishInventory(input: { propertyId: string; from: string; to: string }): Promise<void>;
}
