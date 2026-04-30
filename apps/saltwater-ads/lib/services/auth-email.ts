import { Resend } from 'resend';
import { secrets } from './secrets.ts';

// SAD §5.1 — magic-link email send via Resend.

let _client: Resend | null = null;
function client(): Resend {
  if (_client) return _client;
  _client = new Resend(secrets.resend());
  return _client;
}

export interface SendMagicLinkArgs {
  to: string;
  link: string;     // https://saltwater-ads.<host>/auth/verify?token=...
}

export async function sendMagicLink(_args: SendMagicLinkArgs): Promise<void> {
  // TODO: real email template with Saltwater branding
  void client;
  throw new Error('not_implemented: auth-email.sendMagicLink');
}

export interface PageNickArgs {
  subject: string;
  body: string;
  level: 'info' | 'warn' | 'critical';
}

export async function pageNick(_args: PageNickArgs): Promise<void> {
  // SAD §7 — Nick is on-call via email through Sprint 1.5
  void client;
  throw new Error('not_implemented: auth-email.pageNick');
}
