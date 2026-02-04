const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.CONVEX_SITE_URL;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!BOT_TOKEN || !WEBHOOK_URL || !WEBHOOK_SECRET) {
	console.error(
		"Required env vars: TELEGRAM_BOT_TOKEN, CONVEX_SITE_URL, TELEGRAM_WEBHOOK_SECRET",
	);
	process.exit(1);
}

const apiBase = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function main() {
	// Set webhook
	const setResult = await fetch(`${apiBase}/setWebhook`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: `${WEBHOOK_URL}/telegram-webhook`,
			secret_token: WEBHOOK_SECRET,
			allowed_updates: ["chat_member", "my_chat_member", "message"],
		}),
	});

	const setData = await setResult.json();
	console.log("setWebhook:", JSON.stringify(setData, null, 2));

	// Verify
	const infoResult = await fetch(`${apiBase}/getWebhookInfo`);
	const infoData = await infoResult.json();
	console.log("getWebhookInfo:", JSON.stringify(infoData, null, 2));
}

main();
