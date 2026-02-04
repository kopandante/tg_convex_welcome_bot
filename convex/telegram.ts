import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const handleNewMember = internalAction({
	args: {
		telegramUserId: v.number(),
		firstName: v.string(),
		lastName: v.optional(v.string()),
		username: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const config = await ctx.runQuery(internal.config.getConfig);
		if (!config || config.introTopicId === undefined) {
			return;
		}

		const claimed = await ctx.runMutation(internal.members.claimWelcome, args);
		if (!claimed) {
			return;
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
		if (!botToken) {
			throw new Error("TELEGRAM_BOT_TOKEN is not set");
		}

		const mention = args.username
			? `@${args.username}`
			: `<a href="tg://user?id=${args.telegramUserId}">${escapeHtml(args.firstName)}</a>`;

		const text = `${mention}, добро пожаловать! Расскажи немного о себе.`;

		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: config.chatId,
					message_thread_id: config.introTopicId,
					text,
					parse_mode: "HTML",
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Telegram API error: ${error}`);
		}
	},
});

export const handleTopicMention = internalAction({
	args: {
		chatId: v.number(),
		topicId: v.number(),
		mentions: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const config = await ctx.runQuery(internal.config.getConfig);
		if (!config) {
			return;
		}

		if (config.chatId !== args.chatId) {
			return;
		}

		if (config.introTopicId !== undefined) {
			return;
		}

		if (!args.mentions.includes(config.botUsername)) {
			return;
		}

		const saved = await ctx.runMutation(internal.config.setIntroTopic, {
			introTopicId: args.topicId,
		});

		if (!saved) {
			return;
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
		if (!botToken) {
			throw new Error("TELEGRAM_BOT_TOKEN is not set");
		}
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: args.chatId,
					message_thread_id: args.topicId,
					text: "Тема для знакомств настроена. Новые участники будут приветствоваться здесь.",
					parse_mode: "HTML",
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Telegram API error: ${error}`);
		}
	},
});

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
