import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ComplianceReportsProps {
  farmer: {
    _id: string;
  };
}

export function ComplianceReports({ farmer }: ComplianceReportsProps) {
  const [selectedPractice, setSelectedPractice] = useState("SRI");
  const [isGenerating, setIsGenerating] = useState(false);

  const reports = useQuery(api.reports.getFarmerReports, {
    farmerId: farmer._id as any,
  });

  const generateComplianceReport = useMutation(api.reports.generateComplianceReport);

  const practiceTypes = [
    { value: "SRI", label: "System of Rice Intensification (SRI)" },
    { value: "Organic", label: "Organic Farming" },
    { value: "Regenerative", label: "Regenerative Agriculture" },
    { value: "Integrated", label: "Integrated Pest Management" },
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const endDate = Date.now();
      const startDate = endDate - (90 * 24 * 60 * 60 * 1000); // Last 90 days

      await generateComplianceReport({
        farmerId: farmer._id as any,
        practiceType: selectedPractice,
        startDate,
        endDate,
      });

      toast.success("Compliance report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  if (reports === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Reports</h3>
        <p className="text-gray-600">
          Generate and view compliance reports for certification and carbon credit eligibility.
        </p>
      </div>

      {/* Generate New Report */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Generate New Report</h4>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practice Type
            </label>
            <select
              value={selectedPractice}
              onChange={(e) => setSelectedPractice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {practiceTypes.map((practice) => (
                <option key={practice.value} value={practice.value}>
                  {practice.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? "Generating..." : "📊 Generate Report"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Report will cover the last 90 days of verification data.
        </p>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h4>
          <p className="text-gray-600">Generate your first compliance report to track your certification progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{report.practiceType} Compliance Report</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(report.reportPeriod.startDate).toLocaleDateString()} - {new Date(report.reportPeriod.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${report.certificationEligible ? 'text-green-600' : 'text-orange-600'}`}>
                    {report.overallCompliance.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Compliance</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{report.verificationCount}</div>
                  <div className="text-sm text-gray-600">Total Verifications</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{report.passedVerifications}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{report.verificationCount - report.passedVerifications}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${report.certificationEligible ? 'text-green-600' : 'text-orange-600'}`}>
                    {report.certificationEligible ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Cert. Eligible</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-3">Detailed Breakdown</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Crop Stages</div>
                    <div className="text-lg font-semibold text-gray-900">{report.reportData.cropStages.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Fertilizer Use</div>
                    <div className="text-lg font-semibold text-gray-900">{report.reportData.fertilizerCompliance.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Irrigation</div>
                    <div className="text-lg font-semibold text-gray-900">{report.reportData.irrigationCompliance.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Harvest</div>
                    <div className="text-lg font-semibold text-gray-900">{report.reportData.harvestCompliance.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {report.certificationEligible && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🎉</span>
                    <span className="text-sm font-medium text-green-800">
                      Congratulations! You're eligible for {report.practiceType} certification.
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Generated on {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
