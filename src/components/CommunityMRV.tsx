import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CommunityMRVProps {
  farmer: {
    _id: string;
    name: string;
  };
}

export function CommunityMRV({ farmer }: CommunityMRVProps) {
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    name: "",
    nodeType: "community",
    region: "",
  });

  const loggedInUser = useQuery(api.auth.loggedInUser);

  const mrvNodes = useQuery(api.community.getNearbyMRVNodes, {
    farmerId: farmer._id as any,
  });

  const farmerNode = useQuery(api.community.getFarmerMRVNode, {
    farmerId: farmer._id as any,
  });

  const communityStats = useQuery(api.community.getCommunityStats, {
    farmerId: farmer._id as any,
  });

  const createMRVNode = useMutation(api.community.createMRVNode);
  const joinMRVNode = useMutation(api.community.joinMRVNode);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loggedInUser) {
      toast.error("You must be logged in to create an MRV node");
      return;
    }

    try {
      await createMRVNode({
        name: nodeForm.name,
        nodeType: nodeForm.nodeType as any,
        region: nodeForm.region,
        coordinatorId: loggedInUser._id as any,
        location: { latitude: 0, longitude: 0, region: nodeForm.region },
      });
      toast.success("MRV Node created successfully!");
      setShowCreateNode(false);
      setNodeForm({ name: "", nodeType: "community", region: "" });
    } catch (error) {
      console.error("Error creating MRV node:", error);
      toast.error("Failed to create MRV node");
    }
  };

  const handleJoinNode = async (nodeId: string) => {
    try {
      await joinMRVNode({
        nodeId: nodeId as any,
        farmerId: farmer._id as any,
      });
      toast.success("Successfully joined MRV node!");
    } catch (error) {
      console.error("Error joining MRV node:", error);
      toast.error("Failed to join MRV node");
    }
  };

  if (mrvNodes === undefined || communityStats === undefined || loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const nodeTypeIcons = {
    community: "🏘️",
    regional: "🌍",
    district: "🏛️",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Community MRV Network</h3>
          <p className="text-gray-600">Join or create MRV nodes to pool resources and share costs</p>
        </div>
        {!farmerNode && (
          <button
            onClick={() => setShowCreateNode(!showCreateNode)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            {showCreateNode ? "Cancel" : "🚀 Create Node"}
          </button>
        )}
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="text-3xl mb-4">🤝</div>
          <div className="text-2xl font-bold text-blue-800">{communityStats.totalFarmers}</div>
          <div className="text-sm text-blue-600">Network Farmers</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="text-3xl mb-4">🌾</div>
          <div className="text-2xl font-bold text-green-800">{communityStats.totalArea.toFixed(0)}</div>
          <div className="text-sm text-green-600">Total Area (ha)</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="text-3xl mb-4">💰</div>
          <div className="text-2xl font-bold text-purple-800">{communityStats.totalCredits.toFixed(1)}</div>
          <div className="text-sm text-purple-600">Community Credits</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="text-3xl mb-4">📊</div>
          <div className="text-2xl font-bold text-orange-800">{communityStats.avgConfidence.toFixed(0)}%</div>
          <div className="text-sm text-orange-600">Avg Confidence</div>
        </div>
      </div>

      {/* Current Node Status */}
      {farmerNode && (
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-xl text-white">
          <h4 className="text-lg font-semibold mb-4">🏘️ Your MRV Node</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-green-100 text-sm">Node Name</div>
              <div className="font-semibold">{farmerNode.name}</div>
            </div>
            <div>
              <div className="text-green-100 text-sm">Type</div>
              <div className="font-semibold flex items-center gap-2">
                {nodeTypeIcons[farmerNode.nodeType as keyof typeof nodeTypeIcons]}
                {farmerNode.nodeType}
              </div>
            </div>
            <div>
              <div className="text-green-100 text-sm">Members</div>
              <div className="font-semibold">{farmerNode.memberFarmers.length}</div>
            </div>
            <div>
              <div className="text-green-100 text-sm">Total Credits</div>
              <div className="font-semibold">{farmerNode.totalCarbonCredits.toFixed(1)} tCO₂e</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-100">
            Pooled resources reduce individual MRV costs by up to 60% while maintaining high data quality standards.
          </div>
        </div>
      )}

      {/* Create Node Form */}
      {showCreateNode && !farmerNode && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New MRV Node</h4>
          <form onSubmit={handleCreateNode} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Name *
                </label>
                <input
                  type="text"
                  required
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  placeholder="e.g., Green Valley Farmers MRV"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Type *
                </label>
                <select
                  value={nodeForm.nodeType}
                  onChange={(e) => setNodeForm({ ...nodeForm, nodeType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="community">🏘️ Community (5-20 farmers)</option>
                  <option value="regional">🌍 Regional (20-100 farmers)</option>
                  <option value="district">🏛️ District (100+ farmers)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <input
                type="text"
                required
                value={nodeForm.region}
                onChange={(e) => setNodeForm({ ...nodeForm, region: e.target.value })}
                placeholder="e.g., Punjab, Haryana, West Bengal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Node
              </button>
              <button
                type="button"
                onClick={() => setShowCreateNode(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Available Nodes */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">
            {farmerNode ? "Other MRV Nodes in Your Area" : "Available MRV Nodes"}
          </h4>
        </div>
        
        {mrvNodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏘️</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No MRV Nodes Nearby</h4>
            <p className="text-gray-600 mb-4">Be the first to create an MRV node in your area and invite other farmers to join.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mrvNodes.map((node) => (
              <div key={node._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{nodeTypeIcons[node.nodeType as keyof typeof nodeTypeIcons]}</span>
                    <div>
                      <h5 className="font-medium text-gray-900">{node.name}</h5>
                      <p className="text-sm text-gray-600">{node.location.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      node.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {node.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Members</div>
                    <div className="font-semibold">{node.memberFarmers.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Area</div>
                    <div className="font-semibold">{node.totalArea.toFixed(0)} ha</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Carbon Credits</div>
                    <div className="font-semibold">{node.totalCarbonCredits.toFixed(1)} tCO₂e</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className="font-semibold">{node.confidenceScore.toFixed(0)}%</div>
                  </div>
                </div>

                {node.equipment && (
                  <div className="mb-4">
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Shared Equipment</h6>
                    <div className="flex flex-wrap gap-2">
                      {node.equipment.sensors.map((sensor, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {sensor}
                        </span>
                      ))}
                      {node.equipment.drones > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {node.equipment.drones} Drones
                        </span>
                      )}
                      {node.equipment.weatherStations > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {node.equipment.weatherStations} Weather Stations
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!farmerNode && node.isActive && (
                  <button
                    onClick={() => handleJoinNode(node._id)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join Node
                  </button>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Last updated: {new Date(node.lastUpdated).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Benefits of Community MRV */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">💡 Benefits of Community MRV</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h5 className="font-semibold text-gray-900 mb-2">Cost Sharing</h5>
            <p className="text-sm text-gray-600">Reduce individual MRV costs by 40-60% through shared sensors and equipment</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h5 className="font-semibold text-gray-900 mb-2">Higher Confidence</h5>
            <p className="text-sm text-gray-600">Pooled data increases MRV confidence scores and carbon credit premiums</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h5 className="font-semibold text-gray-900 mb-2">Knowledge Sharing</h5>
            <p className="text-sm text-gray-600">Learn best practices and sustainable techniques from fellow farmers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
