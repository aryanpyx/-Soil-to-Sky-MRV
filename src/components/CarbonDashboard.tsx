import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CarbonDashboardProps {
  farmer: {
    _id: string;
    name: string;
  };
}

export function CarbonDashboard({ farmer }: CarbonDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const carbonCredits = useQuery(api.carbon.getFarmerCarbonCredits, {
    farmerId: farmer._id as any,
  });

  const carbonStats = useQuery(api.carbon.getCarbonStats, {
    farmerId: farmer._id as any,
    days: parseInt(selectedPeriod),
  });

  const generateCarbonCredits = useMutation(api.carbon.generateCarbonCredits);

  const handleGenerateCredits = async () => {
    try {
      await generateCarbonCredits({
        farmerId: farmer._id as any,
      });
      toast.success("Carbon credits calculation initiated!");
    } catch (error) {
      console.error("Error generating credits:", error);
      toast.error("Failed to generate carbon credits");
    }
  };

  if (carbonCredits === undefined || carbonStats === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "issued": return "bg-blue-100 text-blue-800 border-blue-200";
      case "traded": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCreditTypeIcon = (type: string) => {
    switch (type) {
      case "sequestration": return "🌱";
      case "methane_reduction": return "💨";
      case "soil_carbon": return "🌍";
      case "agroforestry": return "🌳";
      default: return "💰";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Carbon Credit Dashboard</h3>
          <p className="text-gray-600">Monitor and manage your carbon credit portfolio</p>
        </div>
        <button
          onClick={handleGenerateCredits}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
        >
          🔄 Calculate Credits
        </button>
      </div>

      {/* Carbon Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🌱</div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs px-2 py-1 border border-green-300 rounded bg-white"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          <div className="text-2xl font-bold text-green-800">{carbonStats.totalSequestration.toFixed(2)}</div>
          <div className="text-sm text-green-600">Total Sequestration (tCO₂)</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="text-3xl mb-4">💨</div>
          <div className="text-2xl font-bold text-blue-800">{carbonStats.methaneReduction.toFixed(2)}</div>
          <div className="text-sm text-blue-600">Methane Reduction (tCO₂e)</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="text-3xl mb-4">💰</div>
          <div className="text-2xl font-bold text-purple-800">{carbonStats.totalCredits.toFixed(2)}</div>
          <div className="text-sm text-purple-600">Total Credits (tCO₂e)</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="text-3xl mb-4">💵</div>
          <div className="text-2xl font-bold text-orange-800">${carbonStats.estimatedValue.toFixed(0)}</div>
          <div className="text-sm text-orange-600">Estimated Value (USD)</div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">MRV Confidence Score</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Data Quality</span>
              <span>{carbonStats.confidenceScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  carbonStats.confidenceScore >= 80 ? 'bg-green-500' :
                  carbonStats.confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${carbonStats.confidenceScore}%` }}
              ></div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              carbonStats.confidenceScore >= 80 ? 'text-green-600' :
              carbonStats.confidenceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {carbonStats.confidenceScore >= 80 ? 'Premium' :
               carbonStats.confidenceScore >= 60 ? 'Standard' : 'Basic'}
            </div>
            <div className="text-xs text-gray-500">Credit Grade</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Higher confidence scores lead to premium carbon credit pricing. Improve by adding more sensor data and satellite verification.</p>
        </div>
      </div>

      {/* Carbon Credits List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Carbon Credit Portfolio</h4>
        </div>
        
        {carbonCredits.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Carbon Credits Yet</h4>
            <p className="text-gray-600 mb-4">Start capturing verification data to generate your first carbon credits.</p>
            <button
              onClick={handleGenerateCredits}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate First Credits
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {carbonCredits.map((credit) => (
              <div key={credit._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCreditTypeIcon(credit.creditType)}</span>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {credit.creditType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <p className="text-sm text-gray-600">{credit.methodology}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{credit.amount.toFixed(2)} tCO₂e</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(credit.status)}`}>
                      {credit.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Confidence Score</div>
                    <div className="font-semibold">{credit.confidenceScore}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estimated Value</div>
                    <div className="font-semibold">${credit.estimatedValue.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Period</div>
                    <div className="font-semibold text-xs">
                      {new Date(credit.verificationPeriod.startDate).toLocaleDateString()} - 
                      {new Date(credit.verificationPeriod.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Evidence</div>
                    <div className="font-semibold">{credit.evidenceRecords.length} records</div>
                  </div>
                </div>

                {credit.status === "verified" && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-green-800">
                        Verified and ready for trading
                      </span>
                    </div>
                  </div>
                )}

                {credit.blockchainTxHash && (
                  <div className="mt-3 text-xs text-gray-500">
                    Blockchain: {credit.blockchainTxHash.substring(0, 20)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blockchain Wallet */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-xl text-white">
        <h4 className="text-lg font-semibold mb-4">🔗 Blockchain Wallet</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-purple-100 text-sm">Wallet Status</div>
            <div className="font-semibold">Connected</div>
          </div>
          <div>
            <div className="text-purple-100 text-sm">Network</div>
            <div className="font-semibold">Polygon</div>
          </div>
          <div>
            <div className="text-purple-100 text-sm">Gas Fees</div>
            <div className="font-semibold">~$0.01</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-purple-100">
          Your carbon credits are securely stored on the blockchain for transparent trading and verification.
        </div>
      </div>
    </div>
  );
}
