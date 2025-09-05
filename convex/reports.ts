import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateComplianceReport = mutation({
  args: {
    farmerId: v.id("farmers"),
    practiceType: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Verify farmer ownership
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.userId !== userId) {
      throw new Error("Farmer not found or access denied");
    }

    // Get verification records for the period
    const verifications = await ctx.db
      .query("verificationRecords")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("practiceType"), args.practiceType),
          q.gte(q.field("timestamp"), args.startDate),
          q.lte(q.field("timestamp"), args.endDate)
        )
      )
      .collect();

    const totalVerifications = verifications.length;
    const passedVerifications = verifications.filter(v => v.aiAnalysis.compliance).length;
    const overallCompliance = totalVerifications > 0 ? (passedVerifications / totalVerifications) * 100 : 0;

    // Calculate specific compliance metrics
    const cropStageVerifications = verifications.filter(v => v.verificationType === "crop_stage");
    const fertilizerVerifications = verifications.filter(v => v.verificationType === "fertilizer_use");
    const irrigationVerifications = verifications.filter(v => v.verificationType === "irrigation");
    const harvestVerifications = verifications.filter(v => v.verificationType === "harvest");

    const reportData = {
      cropStages: cropStageVerifications.filter(v => v.aiAnalysis.compliance).length / Math.max(cropStageVerifications.length, 1) * 100,
      fertilizerCompliance: fertilizerVerifications.filter(v => v.aiAnalysis.compliance).length / Math.max(fertilizerVerifications.length, 1) * 100,
      irrigationCompliance: irrigationVerifications.filter(v => v.aiAnalysis.compliance).length / Math.max(irrigationVerifications.length, 1) * 100,
      harvestCompliance: harvestVerifications.filter(v => v.aiAnalysis.compliance).length / Math.max(harvestVerifications.length, 1) * 100,
    };

    const reportId = await ctx.db.insert("complianceReports", {
      farmerId: args.farmerId,
      reportPeriod: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      practiceType: args.practiceType,
      overallCompliance,
      verificationCount: totalVerifications,
      passedVerifications,
      certificationEligible: overallCompliance >= 80, // 80% threshold for certification
      generatedAt: Date.now(),
      reportData,
    });

    return reportId;
  },
});

export const getFarmerReports = query({
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
      .query("complianceReports")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .order("desc")
      .collect();
  },
});

export const getComplianceStats = query({
  args: {
    practiceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reports;
    
    if (args.practiceType) {
      const practiceType = args.practiceType;
      reports = await ctx.db
        .query("complianceReports")
        .withIndex("by_practice", (q) => q.eq("practiceType", practiceType))
        .collect();
    } else {
      reports = await ctx.db.query("complianceReports").collect();
    }
    
    if (reports.length === 0) {
      return {
        totalFarmers: 0,
        averageCompliance: 0,
        certificationEligible: 0,
        totalVerifications: 0,
      };
    }

    const totalCompliance = reports.reduce((sum, report) => sum + report.overallCompliance, 0);
    const certificationEligible = reports.filter(report => report.certificationEligible).length;
    const totalVerifications = reports.reduce((sum, report) => sum + report.verificationCount, 0);

    return {
      totalFarmers: reports.length,
      averageCompliance: totalCompliance / reports.length,
      certificationEligible,
      totalVerifications,
    };
  },
});
