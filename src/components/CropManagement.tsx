import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CropManagementProps {
  farmer: {
    _id: string;
  };
}

export function CropManagement({ farmer }: CropManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cropType: "",
    variety: "",
    plantingDate: "",
    expectedHarvestDate: "",
    area: "",
    practiceType: "SRI",
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const crops = useQuery(api.crops.getFarmerCrops, {
    farmerId: farmer._id as any,
  });

  const createCrop = useMutation(api.crops.createCrop);
  const updateCropStatus = useMutation(api.crops.updateCropStatus);

  const practiceTypes = [
    { value: "SRI", label: "System of Rice Intensification (SRI)" },
    { value: "Organic", label: "Organic Farming" },
    { value: "Regenerative", label: "Regenerative Agriculture" },
    { value: "Integrated", label: "Integrated Pest Management" },
  ];

  const statusOptions = [
    { value: "planted", label: "🌱 Planted", color: "bg-green-100 text-green-800" },
    { value: "growing", label: "🌿 Growing", color: "bg-blue-100 text-blue-800" },
    { value: "harvested", label: "🌾 Harvested", color: "bg-yellow-100 text-yellow-800" },
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success("Location captured");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get location");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error("Please capture crop location first");
      return;
    }

    try {
      await createCrop({
        farmerId: farmer._id as any,
        cropType: formData.cropType,
        variety: formData.variety || undefined,
        plantingDate: new Date(formData.plantingDate).getTime(),
        expectedHarvestDate: new Date(formData.expectedHarvestDate).getTime(),
        area: parseFloat(formData.area),
        practiceType: formData.practiceType,
        location,
      });

      toast.success("Crop added successfully!");
      setShowAddForm(false);
      setFormData({
        cropType: "",
        variety: "",
        plantingDate: "",
        expectedHarvestDate: "",
        area: "",
        practiceType: "SRI",
      });
      setLocation(null);
    } catch (error) {
      console.error("Error adding crop:", error);
      toast.error("Failed to add crop");
    }
  };

  const handleStatusUpdate = async (cropId: string, newStatus: string) => {
    try {
      await updateCropStatus({
        cropId: cropId as any,
        status: newStatus,
      });
      toast.success("Crop status updated!");
    } catch (error) {
      console.error("Error updating crop status:", error);
      toast.error("Failed to update crop status");
    }
  };

  if (crops === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Crop Management</h3>
          <p className="text-gray-600">Track your crops and their growth stages.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          {showAddForm ? "Cancel" : "🌱 Add Crop"}
        </button>
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Add New Crop</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cropType}
                  onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                  placeholder="e.g., Rice, Wheat, Maize"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variety
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g., Basmati, IR64"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planting Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.plantingDate}
                  onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Harvest Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expectedHarvestDate}
                  onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (hectares) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Type *
                </label>
                <select
                  value={formData.practiceType}
                  onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {practiceTypes.map((practice) => (
                    <option key={practice.value} value={practice.value}>
                      {practice.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Location *
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📍 Capture Location
                </button>
                {location && (
                  <span className="text-sm text-green-600">
                    ✓ Location captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Crop
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crops List */}
      {crops.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌱</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Crops Added</h4>
          <p className="text-gray-600">Add your first crop to start tracking its growth and verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <div key={crop._id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{crop.cropType}</h4>
                  {crop.variety && (
                    <p className="text-sm text-gray-600">{crop.variety}</p>
                  )}
                </div>
                <select
                  value={crop.status}
                  onChange={(e) => handleStatusUpdate(crop._id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium">{crop.area} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Practice:</span>
                  <span className="font-medium">{crop.practiceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Planted:</span>
                  <span className="font-medium">{new Date(crop.plantingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Harvest:</span>
                  <span className="font-medium">{new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  statusOptions.find(s => s.value === crop.status)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {statusOptions.find(s => s.value === crop.status)?.label || crop.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
