import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFarmerCrops = query({
  args: {
    farmerId: v.id("farmers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    return await ctx.db
      .query("crops")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .order("desc")
      .collect();
  },
});

export const createCrop = mutation({
  args: {
    farmerId: v.id("farmers"),
    cropType: v.string(),
    variety: v.optional(v.string()),
    plantingDate: v.number(),
    expectedHarvestDate: v.number(),
    area: v.number(),
    practiceType: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    treeCount: v.optional(v.number()),
    treeSpecies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    // Calculate estimated carbon sequestration
    const sequestrationRates = {
      "SRI": 2.5, // tons CO2/hectare/year
      "Organic": 1.8,
      "Regenerative": 3.2,
      "Agroforestry": 4.5,
    };

    const estimatedCarbonSequestration = (sequestrationRates[args.practiceType as keyof typeof sequestrationRates] || 1.0) * args.area;

    return await ctx.db.insert("crops", {
      ...args,
      status: "planted",
      estimatedCarbonSequestration,
    });
  },
});

export const updateCropStatus = mutation({
  args: {
    cropId: v.id("crops"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const crop = await ctx.db.get(args.cropId);
    if (!crop) {
      throw new Error("Crop not found");
    }

    // Verify farmer ownership
    const farmer = await ctx.db.get(crop.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.cropId, {
      status: args.status,
    });

    return { success: true };
  },
});

export const getCropStats = query({
  args: {
    farmerId: v.id("farmers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    const crops = await ctx.db
      .query("crops")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const totalArea = crops.reduce((sum, crop) => sum + crop.area, 0);
    const totalSequestration = crops.reduce((sum, crop) => sum + (crop.estimatedCarbonSequestration || 0), 0);
    const practiceBreakdown = crops.reduce((acc, crop) => {
      acc[crop.practiceType] = (acc[crop.practiceType] || 0) + crop.area;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCrops: crops.length,
      totalArea,
      totalSequestration,
      practiceBreakdown,
      statusBreakdown: crops.reduce((acc, crop) => {
        acc[crop.status] = (acc[crop.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});
