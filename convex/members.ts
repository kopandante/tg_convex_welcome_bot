import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const claimWelcome = internalMutation({
	args: {
		telegramUserId: v.number(),
		firstName: v.string(),
		lastName: v.optional(v.string()),
		username: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("welcomedMembers")
			.withIndex("by_telegram_user", (q) =>
				q.eq("telegramUserId", args.telegramUserId),
			)
			.first();

		if (existing) {
			return false;
		}

		await ctx.db.insert("welcomedMembers", {
			...args,
			welcomedAt: Date.now(),
		});
		return true;
	},
});
