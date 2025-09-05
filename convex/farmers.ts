import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createFarmer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    farmSize: v.number(),
    primaryCrops: v.array(v.string()),
    certifications: v.array(v.string()),
    cooperativeId: v.optional(v.id("cooperatives")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    return await ctx.db.insert("farmers", {
      ...args,
      userId: userId || undefined,
    });
  },
});

export const getFarmerProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const farmer = await ctx.db
      .query("farmers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return farmer;
  },
});

export const listFarmers = query({
  args: {
    cooperativeId: v.optional(v.id("cooperatives")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("farmers");
    
    if (args.cooperativeId) {
      return await ctx.db
        .query("farmers")
        .withIndex("by_cooperative", (q) => 
          q.eq("cooperativeId", args.cooperativeId)
        )
        .collect();
    }

    return await ctx.db.query("farmers").collect();
  },
});

export const updateFarmer = mutation({
  args: {
    farmerId: v.id("farmers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    farmSize: v.optional(v.number()),
    primaryCrops: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { farmerId, ...updates } = args;
    const userId = await getAuthUserId(ctx);
    
    const farmer = await ctx.db.get(farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    await ctx.db.patch(farmerId, updates);
    return farmerId;
  },
});
