import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface VerificationHistoryProps {
  farmer: {
    _id: string;
  };
}

export function VerificationHistory({ farmer }: VerificationHistoryProps) {
  const verifications = useQuery(api.verification.getFarmerVerifications, {
    farmerId: farmer._id as any,
  });

  if (verifications === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case "crop_stage": return "🌱";
      case "fertilizer_use": return "🧪";
      case "irrigation": return "💧";
      case "harvest": return "🌾";
      case "pest_management": return "🐛";
      case "soil_health": return "🌍";
      default: return "📸";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification History</h3>
        <p className="text-gray-600">
          Track all your verification records and their AI analysis results.
        </p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Verifications Yet</h4>
          <p className="text-gray-600">Start capturing your farming practices to build your verification history.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <div key={verification._id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getVerificationTypeIcon(verification.verificationType)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {verification.verificationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600">{verification.practiceType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                    {verification.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(verification.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {verification.imageUrl && (
                    <img
                      src={verification.imageUrl}
                      alt="Verification"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">AI Analysis</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="text-sm font-medium">{verification.aiAnalysis.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Compliance:</span>
                        <span className={`text-sm font-medium ${verification.aiAnalysis.compliance ? 'text-green-600' : 'text-red-600'}`}>
                          {verification.aiAnalysis.compliance ? '✓ Compliant' : '✗ Non-compliant'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {verification.aiAnalysis.findings.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Findings</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {verification.aiAnalysis.findings.slice(0, 3).map((finding, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {verification.notes && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{verification.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    📍 {verification.location.latitude.toFixed(4)}, {verification.location.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
