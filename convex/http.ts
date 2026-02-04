import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

interface TelegramUser {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	is_bot?: boolean;
}

interface TelegramEntity {
	type: string;
	offset: number;
	length: number;
}

interface TelegramUpdate {
	my_chat_member?: {
		chat: { id: number };
		old_chat_member: { status: string };
		new_chat_member: {
			status: string;
			user: TelegramUser;
		};
	};
	chat_member?: {
		chat: { id: number };
		old_chat_member: { status: string };
		new_chat_member: {
			status: string;
			user: TelegramUser;
		};
	};
	message?: {
		chat: { id: number };
		message_thread_id?: number;
		text?: string;
		entities?: TelegramEntity[];
	};
}

function extractMentions(
	text: string | undefined,
	entities: TelegramEntity[] | undefined,
): string[] {
	if (!text || !entities) return [];
	return entities
		.filter((e) => e.type === "mention")
		.map((e) => text.slice(e.offset + 1, e.offset + e.length).toLowerCase());
}

const http = httpRouter();

http.route({
	path: "/telegram-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
		if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
			return new Response("Unauthorized", { status: 200 });
		}

		try {
			const body = (await request.json()) as TelegramUpdate;

			// 1. Bot added to chat
			if (body.my_chat_member) {
				const { old_chat_member, new_chat_member, chat } = body.my_chat_member;
				const wasOut =
					old_chat_member.status === "left" ||
					old_chat_member.status === "kicked";
				const isIn =
					new_chat_member.status === "member" ||
					new_chat_member.status === "administrator" ||
					new_chat_member.status === "restricted";

				if (wasOut && isIn && new_chat_member.user.is_bot) {
					await ctx.runMutation(internal.config.initChat, {
						chatId: chat.id,
						botUsername: (new_chat_member.user.username ?? "").toLowerCase(),
					});
				}
			}

			// 2. Message with thread -- topic mention detection
			if (body.message?.message_thread_id) {
				const mentions = extractMentions(
					body.message.text,
					body.message.entities,
				);
				if (mentions.length > 0) {
					await ctx.runAction(internal.telegram.handleTopicMention, {
						chatId: body.message.chat.id,
						topicId: body.message.message_thread_id,
						mentions,
					});
				}
			}

			// 3. New member joined
			if (body.chat_member) {
				const { old_chat_member, new_chat_member } = body.chat_member;
				const wasOut =
					old_chat_member.status === "left" ||
					old_chat_member.status === "kicked";
				const isIn =
					new_chat_member.status === "member" ||
					new_chat_member.status === "restricted";

				if (wasOut && isIn) {
					const user = new_chat_member.user;
					await ctx.runAction(internal.telegram.handleNewMember, {
						telegramUserId: user.id,
						firstName: user.first_name,
						lastName: user.last_name ?? undefined,
						username: user.username ?? undefined,
					});
				}
			}
		} catch (e) {
			console.error("Webhook processing error:", e);
		}

		return new Response("ok", { status: 200 });
	}),
});

export default http;
