import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getNearbyMRVNodes = query({
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

    // Get all active MRV nodes (in production, would filter by location)
    return await ctx.db
      .query("mrvNodes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getFarmerMRVNode = query({
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

    // Find MRV node that includes this farmer
    const nodes = await ctx.db.query("mrvNodes").collect();
    return nodes.find(node => node.memberFarmers.includes(args.farmerId)) || null;
  },
});

export const getCommunityStats = query({
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

    const nodes = await ctx.db.query("mrvNodes").collect();
    const totalFarmers = nodes.reduce((sum, node) => sum + node.memberFarmers.length, 0);
    const totalArea = nodes.reduce((sum, node) => sum + node.totalArea, 0);
    const totalCredits = nodes.reduce((sum, node) => sum + node.totalCarbonCredits, 0);
    const avgConfidence = nodes.length > 0 
      ? nodes.reduce((sum, node) => sum + node.confidenceScore, 0) / nodes.length 
      : 0;

    return {
      totalFarmers,
      totalArea,
      totalCredits,
      avgConfidence,
    };
  },
});

export const createMRVNode = mutation({
  args: {
    name: v.string(),
    nodeType: v.string(),
    region: v.string(),
    coordinatorId: v.id("users"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      region: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    if (args.coordinatorId !== userId) {
      throw new Error("Access denied");
    }

    // Get the farmer profile to add as first member
    const farmer = await ctx.db
      .query("farmers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!farmer) {
      throw new Error("Farmer profile not found");
    }

    return await ctx.db.insert("mrvNodes", {
      name: args.name,
      nodeType: args.nodeType,
      location: args.location,
      coordinatorId: args.coordinatorId,
      memberFarmers: [farmer._id],
      isActive: true,
      totalArea: farmer.farmSize,
      totalCarbonCredits: 0,
      verifiedCarbonCredits: 0,
      confidenceScore: 75,
      lastUpdated: Date.now(),
      equipment: {
        sensors: ["soil_moisture", "temperature"],
        drones: 1,
        weatherStations: 1,
        internetConnectivity: "good",
      },
    });
  },
});

export const joinMRVNode = mutation({
  args: {
    nodeId: v.id("mrvNodes"),
    farmerId: v.id("farmers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      throw new Error("MRV node not found");
    }

    // Check if farmer is already a member
    if (node.memberFarmers.includes(args.farmerId)) {
      throw new Error("Farmer is already a member of this node");
    }

    // Add farmer to the node
    await ctx.db.patch(args.nodeId, {
      memberFarmers: [...node.memberFarmers, args.farmerId],
      totalArea: node.totalArea + farmer.farmSize,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});
