import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFarmerSensorData = query({
  args: {
    farmerId: v.id("farmers"),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    const startTime = Date.now() - (args.hours * 60 * 60 * 1000);

    return await ctx.db
      .query("sensorData")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .order("desc")
      .collect();
  },
});

export const getLatestSatelliteData = query({
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

    // Get latest verification record with satellite data
    const verification = await ctx.db
      .query("verificationRecords")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => q.neq(q.field("satelliteData"), undefined))
      .order("desc")
      .first();

    return verification?.satelliteData || null;
  },
});

export const addSensor = mutation({
  args: {
    farmerId: v.id("farmers"),
    sensorType: v.string(),
    sensorId: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    // Generate initial sensor reading
    const mockReadings = {
      soil_moisture: { value: Math.random() * 100, unit: "%" },
      methane: { value: Math.random() * 50 + 300, unit: "ppm" },
      temperature: { value: Math.random() * 15 + 20, unit: "°C" },
      ph: { value: Math.random() * 2 + 6, unit: "pH" },
      drone: { value: Math.random() * 50 + 100, unit: "m" },
    };

    const reading = mockReadings[args.sensorType as keyof typeof mockReadings] || { value: 0, unit: "" };

    return await ctx.db.insert("sensorData", {
      farmerId: args.farmerId,
      sensorId: args.sensorId,
      sensorType: args.sensorType,
      location: args.location,
      timestamp: Date.now(),
      readings: {
        ...reading,
        quality: "good",
      },
      metadata: {
        batteryLevel: Math.floor(Math.random() * 40) + 60,
        signalStrength: Math.floor(Math.random() * 30) + 70,
        calibrationDate: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  },
});

export const addSensorReading = mutation({
  args: {
    farmerId: v.id("farmers"),
    sensorId: v.string(),
    sensorType: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    readings: v.object({
      value: v.number(),
      unit: v.string(),
      quality: v.optional(v.string()),
    }),
    metadata: v.optional(v.object({
      batteryLevel: v.optional(v.number()),
      signalStrength: v.optional(v.number()),
      calibrationDate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    return await ctx.db.insert("sensorData", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
