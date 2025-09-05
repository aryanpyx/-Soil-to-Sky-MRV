import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createVerificationRecord = mutation({
  args: {
    farmerId: v.id("farmers"),
    cropId: v.optional(v.id("crops")),
    practiceType: v.string(),
    verificationType: v.string(),
    imageId: v.id("_storage"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    const recordId = await ctx.db.insert("verificationRecords", {
      ...args,
      timestamp: Date.now(),
      aiAnalysis: {
        confidence: 0,
        compliance: false,
        findings: [],
      },
      status: "pending",
    });

    // Schedule AI analysis
    await ctx.scheduler.runAfter(0, api.verification.analyzeVerificationImage, {
      recordId,
    });

    return recordId;
  },
});

export const analyzeVerificationImage = action({
  args: {
    recordId: v.id("verificationRecords"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.runQuery(api.verification.getVerificationRecord, {
      recordId: args.recordId,
    });

    if (!record) {
      throw new Error("Verification record not found");
    }

    // Get image URL for analysis
    const imageUrl = await ctx.storage.getUrl(record.imageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    // AI Analysis using OpenAI Vision
    const analysisPrompt = `
    Analyze this agricultural image for ${record.practiceType} farming compliance.
    
    Verification type: ${record.verificationType}
    Practice type: ${record.practiceType}
    
    Please assess:
    1. Compliance with sustainable farming practices
    2. Crop health and growth stage
    3. Evidence of proper irrigation/fertilizer use
    4. Any signs of pest/disease issues
    5. Overall sustainability indicators
    
    Provide a confidence score (0-100) and specific findings.
    `;

    try {
      const openai = new (await import("openai")).default({
        baseURL: process.env.CONVEX_OPENAI_BASE_URL,
        apiKey: process.env.CONVEX_OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
      });

      const analysis = response.choices[0].message.content;
      
      // Parse AI response (simplified - in production, use structured output)
      const confidence = Math.floor(Math.random() * 40) + 60; // Mock confidence 60-100%
      const compliance = confidence > 75;
      const findings = analysis?.split('\n').filter((line: string) => line.trim()) || [];

      await ctx.runMutation(api.verification.updateVerificationAnalysis, {
        recordId: args.recordId,
        aiAnalysis: {
          confidence,
          compliance,
          findings: findings.slice(0, 5), // Limit findings
          recommendations: compliance ? [] : ["Consider reviewing irrigation schedule", "Check fertilizer application"],
        },
        status: compliance ? "verified" : "pending",
      });

    } catch (error) {
      console.error("AI analysis failed:", error);
      
      // Fallback analysis
      await ctx.runMutation(api.verification.updateVerificationAnalysis, {
        recordId: args.recordId,
        aiAnalysis: {
          confidence: 50,
          compliance: false,
          findings: ["AI analysis temporarily unavailable"],
        },
        status: "pending",
      });
    }
  },
});

export const updateVerificationAnalysis = mutation({
  args: {
    recordId: v.id("verificationRecords"),
    aiAnalysis: v.object({
      confidence: v.number(),
      compliance: v.boolean(),
      findings: v.array(v.string()),
      recommendations: v.optional(v.array(v.string())),
    }),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      aiAnalysis: args.aiAnalysis,
      status: args.status,
    });
  },
});

export const getVerificationRecord = query({
  args: {
    recordId: v.id("verificationRecords"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recordId);
  },
});

export const getFarmerVerifications = query({
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

    const records = await ctx.db
      .query("verificationRecords")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .order("desc")
      .collect();

    return Promise.all(
      records.map(async (record) => ({
        ...record,
        imageUrl: await ctx.storage.getUrl(record.imageId),
      }))
    );
  },
});

export const getVerificationsByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verificationRecords")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(50);
  },
});
