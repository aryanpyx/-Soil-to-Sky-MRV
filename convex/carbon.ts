import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFarmerCarbonCredits = query({
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
      .query("carbonCredits")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .order("desc")
      .collect();
  },
});

export const getCarbonStats = query({
  args: {
    farmerId: v.id("farmers"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    const startDate = Date.now() - (args.days * 24 * 60 * 60 * 1000);
    
    const carbonCredits = await ctx.db
      .query("carbonCredits")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => q.gte(q.field("verificationPeriod.startDate"), startDate))
      .collect();

    const totalSequestration = carbonCredits
      .filter(c => c.creditType === "sequestration")
      .reduce((sum, c) => sum + c.amount, 0);

    const methaneReduction = carbonCredits
      .filter(c => c.creditType === "methane_reduction")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalCredits = carbonCredits.reduce((sum, c) => sum + c.amount, 0);
    const estimatedValue = totalCredits * 15; // $15 per credit estimate
    const confidenceScore = carbonCredits.length > 0 
      ? carbonCredits.reduce((sum, c) => sum + c.confidenceScore, 0) / carbonCredits.length 
      : 0;

    return {
      totalSequestration,
      methaneReduction,
      totalCredits,
      estimatedValue,
      confidenceScore,
    };
  },
});

export const generateCarbonCredits = mutation({
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

    // Get recent verification records
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const verifications = await ctx.db
      .query("verificationRecords")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), thirtyDaysAgo),
          q.eq(q.field("status"), "verified")
        )
      )
      .collect();

    if (verifications.length === 0) {
      throw new Error("No verified records found for carbon credit generation");
    }

    // Calculate carbon credits based on practice types
    const practiceCredits = {
      "SRI": 2.5, // tons CO2/hectare/year
      "Organic": 1.8,
      "Regenerative": 3.2,
      "Agroforestry": 4.5,
    };

    const crops = await ctx.db
      .query("crops")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    for (const crop of crops) {
      const creditAmount = (practiceCredits[crop.practiceType as keyof typeof practiceCredits] || 1.0) * crop.area;
      const confidenceScore = Math.min(95, 60 + (verifications.length * 5));

      await ctx.db.insert("carbonCredits", {
        farmerId: args.farmerId,
        creditType: crop.practiceType === "Agroforestry" ? "agroforestry" : "sequestration",
        amount: creditAmount,
        status: "pending",
        verificationPeriod: {
          startDate: thirtyDaysAgo,
          endDate: Date.now(),
        },
        methodology: "VM0042",
        confidenceScore,
        estimatedValue: creditAmount * 15,
        evidenceRecords: verifications.map(v => v._id),
      });
    }

    return { success: true, creditsGenerated: crops.length };
  },
});
