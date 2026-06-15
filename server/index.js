import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Webhook } from 'svix';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');
const NOTIFY_TO = process.env.NOTIFY_TO || 'docsobers@mac.com';
const PORT = Number(process.env.PORT) || 3000;

function formatSignupTime(createdAtMs) {
  const date = new Date(createdAtMs);
  return date.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/New_York',
  });
}

function resolveUsername(user) {
  if (user.username) return user.username;
  const primaryId = user.primary_email_address_id;
  const emails = user.email_addresses ?? [];
  const primary = emails.find((entry) => entry.id === primaryId) ?? emails[0];
  if (primary?.email_address) return primary.email_address;
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return user.id;
}

function resolveLocation(clientIp) {
  if (!clientIp) return 'Unknown (IP not provided by Clerk)';
  const geo = geoip.lookup(clientIp);
  if (!geo) return `Unknown (could not geolocate ${clientIp})`;
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : `Unknown (${clientIp})`;
}

function createMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendSignupEmail({ username, signedUpAt, location }) {
  const transporter = createMailer();
  if (!transporter) {
    console.warn(
      '[signup-notify] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email not sent.'
    );
    return false;
  }

  const from = process.env.NOTIFY_FROM || process.env.SMTP_USER;
  const subject = `Jazz Lines: new signup — ${username}`;
  const text = [
    'A new user signed up for Jazz Lines.',
    '',
    `Username: ${username}`,
    `Signed up: ${signedUpAt}`,
    `Location: ${location}`,
  ].join('\n');

  await transporter.sendMail({
    from,
    to: NOTIFY_TO,
    subject,
    text,
  });

  return true;
}

async function handleUserCreated(event) {
  const user = event.data;
  const username = resolveUsername(user);
  const signedUpAt = formatSignupTime(user.created_at);
  const clientIp = event.event_attributes?.http_request?.client_ip;
  const location = resolveLocation(clientIp);

  const sent = await sendSignupEmail({ username, signedUpAt, location });
  console.info(
    `[signup-notify] ${username} @ ${signedUpAt} (${location})${sent ? ' — email sent' : ''}`
  );
}

async function clerkWebhookHandler(req, res) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[signup-notify] CLERK_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing Svix headers' });
  }

  let event;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (error) {
    console.error('[signup-notify] Webhook verification failed:', error);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    if (event.type === 'user.created') {
      await handleUserCreated(event);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[signup-notify] Handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

const app = express();

app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('[server] dist/ not found — static files and SPA routes are disabled');
}

app.listen(PORT, () => {
  console.info(`[server] Listening on port ${PORT}`);
});
