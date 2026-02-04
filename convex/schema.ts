import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	botConfig: defineTable({
		chatId: v.number(),
		introTopicId: v.optional(v.number()),
		botUsername: v.string(),
	}),

	welcomedMembers: defineTable({
		telegramUserId: v.number(),
		firstName: v.string(),
		lastName: v.optional(v.string()),
		username: v.optional(v.string()),
		welcomedAt: v.number(),
	}).index("by_telegram_user", ["telegramUserId"]),
});
