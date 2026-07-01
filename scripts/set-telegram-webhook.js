// Run this script once to set the webhook URL for Telegram
// node scripts/set-telegram-webhook.js <YOUR_NGROK_OR_VERCEL_URL>

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const domain = process.argv[2];

if (!token || !domain) {
  console.error("Usage: node set-telegram-webhook.js <DOMAIN>");
  process.exit(1);
}

const webhookUrl = `${domain}/api/telegram/webhook${secret ? `?secret=${secret}` : ''}`;
const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Telegram API Response:', data));
}).on('error', (err) => console.error(err));
