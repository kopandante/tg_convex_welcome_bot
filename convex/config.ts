import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const initChat = internalMutation({
	args: {
		chatId: v.number(),
		botUsername: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query("botConfig").first();
		if (existing) {
			return false;
		}
		await ctx.db.insert("botConfig", {
			chatId: args.chatId,
			botUsername: args.botUsername,
		});
		return true;
	},
});

export const setIntroTopic = internalMutation({
	args: {
		introTopicId: v.number(),
	},
	handler: async (ctx, args) => {
		const config = await ctx.db.query("botConfig").first();
		if (!config || config.introTopicId !== undefined) {
			return false;
		}
		await ctx.db.patch(config._id, { introTopicId: args.introTopicId });
		return true;
	},
});

export const getConfig = internalQuery({
	handler: async (ctx) => {
		return await ctx.db.query("botConfig").first();
	},
});
