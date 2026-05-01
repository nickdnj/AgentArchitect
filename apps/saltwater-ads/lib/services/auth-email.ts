import { Resend } from 'resend';
import { secrets } from './secrets.ts';
import { log } from '@lib/log.ts';

// SAD §5.1 — magic-link email send via Resend.

interface ResendLike {
  emails: {
    send: (params: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
    }) => Promise<unknown>;
  };
}

let _client: ResendLike | null = null;

function client(): ResendLike {
  if (_client) return _client;
  _client = new Resend(secrets.resend()) as unknown as ResendLike;
  return _client;
}

/**
 * Test-only: inject a fake client. Pass `null` to reset.
 * Tests use this so they can assert send was called and capture params.
 */
export function setResendClientForTest(c: ResendLike | null): void {
  _client = c;
}

const FROM_ADDRESS = process.env.MAGIC_LINK_FROM ?? 'Saltwater Ads <noreply@saltwater-ads.test>';

export interface SendMagicLinkArgs {
  to: string;
  link: string;     // https://saltwater-ads.<host>/auth/verify?token=...
}

function magicLinkHtml(link: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h1 style="color: #1a3a52;">Saltwater Ads — sign in</h1>
    <p>Click the link below to sign in. Expires in 15 minutes. Do not share.</p>
    <p style="margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: #1a3a52; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px;">Sign in to Saltwater Ads</a>
    </p>
    <p style="font-size: 12px; color: #666;">If you didn't request this, you can ignore the email — the link is single-use and short-lived.</p>
  </body>
</html>`;
}

function magicLinkText(link: string): string {
  return `Saltwater Ads sign-in link (expires in 15 minutes):

${link}

If you didn't request this, ignore the email.`;
}

export async function sendMagicLink(args: SendMagicLinkArgs): Promise<void> {
  await client().emails.send({
    from: FROM_ADDRESS,
    to: args.to,
    subject: 'Your Saltwater Ads sign-in link',
    html: magicLinkHtml(args.link),
    text: magicLinkText(args.link),
  });
}

export interface PageNickArgs {
  subject: string;
  body: string;
  level: 'info' | 'warn' | 'critical';
}

const NICK_ADDRESS = process.env.NICK_PAGE_TO ?? 'nickd@demarconet.com';

export async function pageNick(args: PageNickArgs): Promise<void> {
  // SAD §7 — Nick is on-call via email through Sprint 1.5
  try {
    await client().emails.send({
      from: FROM_ADDRESS,
      to: NICK_ADDRESS,
      subject: `[Saltwater Ads ${args.level.toUpperCase()}] ${args.subject}`,
      html: `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(args.body)}</pre>`,
      text: args.body,
    });
  } catch (err) {
    // Pager paths must not throw — they're called from error paths already.
    log.error({ err: { message: (err as Error).message }, level: args.level }, 'page_nick_failed');
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch] ?? ch);
}
