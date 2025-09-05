import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  farmers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    farmSize: v.number(), // in hectares
    primaryCrops: v.array(v.string()),
    certifications: v.array(v.string()),
    cooperativeId: v.optional(v.id("cooperatives")),
    userId: v.optional(v.id("users")),
    // Carbon credit specific fields
    carbonWalletAddress: v.optional(v.string()),
    totalCarbonCredits: v.optional(v.number()),
    verifiedCarbonCredits: v.optional(v.number()),
    pendingCarbonCredits: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_cooperative", ["cooperativeId"]),

  cooperatives: defineTable({
    name: v.string(),
    location: v.string(),
    contactEmail: v.string(),
    memberCount: v.number(),
    sustainabilityStandards: v.array(v.string()),
    // MRV Node specific fields
    nodeType: v.string(), // "community", "regional", "district"
    totalCarbonCredits: v.optional(v.number()),
    isActive: v.boolean(),
  }),

  crops: defineTable({
    farmerId: v.id("farmers"),
    cropType: v.string(),
    variety: v.optional(v.string()),
    plantingDate: v.number(),
    expectedHarvestDate: v.number(),
    area: v.number(), // in hectares
    practiceType: v.string(), // "SRI", "Organic", "Regenerative", "Agroforestry"
    status: v.string(), // "planted", "growing", "harvested"
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    // Carbon sequestration fields
    estimatedCarbonSequestration: v.optional(v.number()), // tons CO2/year
    treeCount: v.optional(v.number()), // for agroforestry
    treeSpecies: v.optional(v.array(v.string())),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_practice", ["practiceType"])
    .index("by_status", ["status"]),

  verificationRecords: defineTable({
    farmerId: v.id("farmers"),
    cropId: v.optional(v.id("crops")),
    practiceType: v.string(),
    verificationType: v.string(), // "crop_stage", "fertilizer_use", "irrigation", "harvest", "tree_planting", "methane_reduction"
    imageId: v.id("_storage"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    timestamp: v.number(),
    aiAnalysis: v.object({
      confidence: v.number(),
      compliance: v.boolean(),
      findings: v.array(v.string()),
      recommendations: v.optional(v.array(v.string())),
      carbonImpact: v.optional(v.number()), // estimated CO2 impact
    }),
    verifiedBy: v.optional(v.id("users")), // field agent or peer verifier
    status: v.string(), // "pending", "verified", "rejected"
    notes: v.optional(v.string()),
    // Satellite data integration
    satelliteData: v.optional(v.object({
      ndvi: v.optional(v.number()),
      soilMoisture: v.optional(v.number()),
      biomass: v.optional(v.number()),
      acquisitionDate: v.optional(v.number()),
    })),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_crop", ["cropId"])
    .index("by_status", ["status"])
    .index("by_practice", ["practiceType"]),

  sensorData: defineTable({
    farmerId: v.id("farmers"),
    cropId: v.optional(v.id("crops")),
    sensorId: v.string(),
    sensorType: v.string(), // "soil_moisture", "methane", "temperature", "ph", "drone"
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    timestamp: v.number(),
    readings: v.object({
      value: v.number(),
      unit: v.string(),
      quality: v.optional(v.string()), // "good", "fair", "poor"
    }),
    metadata: v.optional(v.object({
      batteryLevel: v.optional(v.number()),
      signalStrength: v.optional(v.number()),
      calibrationDate: v.optional(v.number()),
    })),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_sensor", ["sensorId"])
    .index("by_type", ["sensorType"])
    .index("by_timestamp", ["timestamp"]),

  carbonCredits: defineTable({
    farmerId: v.id("farmers"),
    cooperativeId: v.optional(v.id("cooperatives")),
    creditType: v.string(), // "sequestration", "methane_reduction", "soil_carbon", "agroforestry"
    amount: v.number(), // tons CO2 equivalent
    status: v.string(), // "pending", "verified", "issued", "traded"
    verificationPeriod: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
    methodology: v.string(), // "VM0042", "CDM", "VCS", etc.
    confidenceScore: v.number(), // 0-100 based on MRV data quality
    estimatedValue: v.number(), // in USD
    actualValue: v.optional(v.number()), // when traded
    blockchainTxHash: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    tradedAt: v.optional(v.number()),
    // MRV evidence
    evidenceRecords: v.array(v.id("verificationRecords")),
    satelliteEvidence: v.optional(v.array(v.string())), // satellite image URLs
    sensorEvidence: v.optional(v.array(v.id("sensorData"))),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_cooperative", ["cooperativeId"])
    .index("by_status", ["status"])
    .index("by_type", ["creditType"])
    .index("by_confidence", ["confidenceScore"]),

  complianceReports: defineTable({
    farmerId: v.id("farmers"),
    reportPeriod: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
    practiceType: v.string(),
    overallCompliance: v.number(), // percentage
    verificationCount: v.number(),
    passedVerifications: v.number(),
    certificationEligible: v.boolean(),
    generatedAt: v.number(),
    reportData: v.object({
      cropStages: v.number(),
      fertilizerCompliance: v.number(),
      irrigationCompliance: v.number(),
      harvestCompliance: v.number(),
      carbonSequestration: v.optional(v.number()),
      methaneReduction: v.optional(v.number()),
    }),
    // Carbon credit specific metrics
    carbonMetrics: v.optional(v.object({
      totalSequestration: v.number(), // tons CO2
      methaneReduction: v.number(), // tons CO2 equivalent
      soilCarbonIncrease: v.number(), // percentage
      biomassIncrease: v.number(), // percentage
      creditsGenerated: v.number(),
      creditsVerified: v.number(),
      estimatedEarnings: v.number(), // USD
    })),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_practice", ["practiceType"])
    .index("by_period", ["reportPeriod.startDate", "reportPeriod.endDate"]),

  mrvNodes: defineTable({
    name: v.string(),
    nodeType: v.string(), // "community", "regional", "district"
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      region: v.string(),
    }),
    coordinatorId: v.id("users"),
    memberFarmers: v.array(v.id("farmers")),
    cooperativeId: v.optional(v.id("cooperatives")),
    isActive: v.boolean(),
    totalArea: v.number(), // hectares
    totalCarbonCredits: v.number(),
    verifiedCarbonCredits: v.number(),
    confidenceScore: v.number(), // average of all member farmers
    lastUpdated: v.number(),
    // Equipment and infrastructure
    equipment: v.optional(v.object({
      sensors: v.array(v.string()),
      drones: v.number(),
      weatherStations: v.number(),
      internetConnectivity: v.string(), // "good", "fair", "poor"
    })),
  })
    .index("by_coordinator", ["coordinatorId"])
    .index("by_cooperative", ["cooperativeId"])
    .index("by_type", ["nodeType"])
    .index("by_active", ["isActive"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
