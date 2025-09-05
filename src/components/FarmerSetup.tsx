import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function FarmerSetup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    farmSize: "",
    address: "",
    primaryCrops: "",
    certifications: "",
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const createFarmer = useMutation(api.farmers.createFarmer);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsGettingLocation(false);
          toast.success("Location captured successfully");
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
          toast.error("Could not get location. Please enable location services.");
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error("Please capture your farm location first");
      return;
    }

    try {
      await createFarmer({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: formData.address || undefined,
        },
        farmSize: parseFloat(formData.farmSize),
        primaryCrops: formData.primaryCrops.split(",").map(crop => crop.trim()).filter(Boolean),
        certifications: formData.certifications.split(",").map(cert => cert.trim()).filter(Boolean),
      });
      
      toast.success("Farmer profile created successfully!");
    } catch (error) {
      console.error("Error creating farmer profile:", error);
      toast.error("Failed to create farmer profile");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Up Your Farmer Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Size (hectares) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.farmSize}
              onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Location *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGettingLocation ? "Getting Location..." : "📍 Capture Location"}
              </button>
              {location && (
                <span className="text-sm text-green-600">
                  ✓ Location captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Farm address (optional)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Crops (comma-separated) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Rice, Wheat, Maize"
              value={formData.primaryCrops}
              onChange={(e) => setFormData({ ...formData, primaryCrops: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Certifications (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g., Organic, Fair Trade"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Farmer Profile
          </button>
        </form>
      </div>
    </div>
  );
}
