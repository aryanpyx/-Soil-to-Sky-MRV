import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VerificationCapture } from "./VerificationCapture";
import { VerificationHistory } from "./VerificationHistory";
import { ComplianceReports } from "./ComplianceReports";
import { CropManagement } from "./CropManagement";
import { CarbonDashboard } from "./CarbonDashboard";
import { SensorMonitoring } from "./SensorMonitoring";
import { CommunityMRV } from "./CommunityMRV";

interface DashboardProps {
  farmer: {
    _id: string;
    name: string;
    farmSize: number;
    primaryCrops: string[];
    certifications: string[];
    totalCarbonCredits?: number;
    verifiedCarbonCredits?: number;
    pendingCarbonCredits?: number;
  };
}

export function Dashboard({ farmer }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("carbon");
  
  const verifications = useQuery(api.verification.getFarmerVerifications, {
    farmerId: farmer._id as any,
  });

  const carbonCredits = useQuery(api.carbon.getFarmerCarbonCredits, {
    farmerId: farmer._id as any,
  });

  const recentVerifications = verifications?.slice(0, 5) || [];
  const complianceRate = verifications?.length 
    ? (verifications.filter(v => v.aiAnalysis.compliance).length / verifications.length) * 100 
    : 0;

  const totalCredits = farmer.totalCarbonCredits || 0;
  const verifiedCredits = farmer.verifiedCarbonCredits || 0;
  const pendingCredits = farmer.pendingCarbonCredits || 0;
  const estimatedEarnings = verifiedCredits * 15; // $15 per credit estimate

  const tabs = [
    { id: "carbon", label: "💰 Carbon Credits", icon: "💰" },
    { id: "capture", label: "📸 Capture", icon: "📸" },
    { id: "sensors", label: "📡 Sensors", icon: "📡" },
    { id: "crops", label: "🌱 Crops", icon: "🌱" },
    { id: "community", label: "🤝 Community", icon: "🤝" },
    { id: "history", label: "📋 History", icon: "📋" },
    { id: "reports", label: "📊 Reports", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {farmer.name}</h1>
            <p className="text-green-100">Farm size: {farmer.farmSize} hectares</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{complianceRate.toFixed(1)}%</div>
            <div className="text-sm text-green-100">MRV Compliance</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-white/80 font-semibold text-sm">Total Credits</div>
            <div className="text-2xl font-bold">{totalCredits.toFixed(2)}</div>
            <div className="text-xs text-white/70">tCO₂e</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-white/80 font-semibold text-sm">Verified</div>
            <div className="text-2xl font-bold text-green-200">{verifiedCredits.toFixed(2)}</div>
            <div className="text-xs text-white/70">tCO₂e</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-white/80 font-semibold text-sm">Pending</div>
            <div className="text-2xl font-bold text-yellow-200">{pendingCredits.toFixed(2)}</div>
            <div className="text-xs text-white/70">tCO₂e</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-white/80 font-semibold text-sm">Est. Earnings</div>
            <div className="text-2xl font-bold text-green-200">${estimatedEarnings.toFixed(0)}</div>
            <div className="text-xs text-white/70">USD</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <div className="text-green-600 font-semibold text-sm">Total Verifications</div>
          <div className="text-2xl font-bold text-green-800">{verifications?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <div className="text-blue-600 font-semibold text-sm">Primary Crops</div>
          <div className="text-sm text-blue-800">{farmer.primaryCrops.join(", ")}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="text-purple-600 font-semibold text-sm">Certifications</div>
          <div className="text-sm text-purple-800">
            {farmer.certifications.length > 0 ? farmer.certifications.join(", ") : "None"}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <div className="text-orange-600 font-semibold text-sm">Recent Activity</div>
          <div className="text-sm text-orange-800">
            {recentVerifications.length > 0 
              ? `${recentVerifications.length} recent verifications`
              : "No recent activity"
            }
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "carbon" && <CarbonDashboard farmer={farmer} />}
          {activeTab === "capture" && <VerificationCapture farmer={farmer} />}
          {activeTab === "sensors" && <SensorMonitoring farmer={farmer} />}
          {activeTab === "crops" && <CropManagement farmer={farmer} />}
          {activeTab === "community" && <CommunityMRV farmer={farmer} />}
          {activeTab === "history" && <VerificationHistory farmer={farmer} />}
          {activeTab === "reports" && <ComplianceReports farmer={farmer} />}
        </div>
      </div>
    </div>
  );
}
