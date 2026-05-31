#!/usr/bin/env npx tsx
/**
 * Gate QA — mint a signed review entry URL.
 *
 * Usage:
 *   APP_URL=http://localhost:3000 GENERATE_TOKEN_API_KEY=dev-gate-key \
 *     npx tsx scripts/generate-review-link.ts --order 1234567890 --type buyer
 *
 * Or POST directly:
 *   curl -X POST http://localhost:3000/generate-token \
 *     -H "Content-Type: application/json" \
 *     -H "X-Reviews-Api-Key: dev-gate-key" \
 *     -d '{"order_id":"1234567890","reviewer_type":"buyer"}'
 */

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const orderId = arg('order');
const reviewerType = arg('type') ?? 'buyer';
const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
const apiKey = process.env.GENERATE_TOKEN_API_KEY;

if (!orderId) {
  console.error('Usage: generate-review-link.ts --order ORDER_ID [--type buyer|recipient|gifter|accessory]');
  process.exit(1);
}

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (apiKey) headers['X-Reviews-Api-Key'] = apiKey;

const res = await fetch(`${appUrl.replace(/\/$/, '')}/generate-token`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ order_id: orderId, reviewer_type: reviewerType }),
});

const data = await res.json();
if (!res.ok) {
  console.error('Error:', data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
console.log('\nEntry URL:\n', data.entry_url);
