import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface VerificationCaptureProps {
  farmer: {
    _id: string;
    name: string;
  };
}

export function VerificationCapture({ farmer }: VerificationCaptureProps) {
  const [selectedPractice, setSelectedPractice] = useState("SRI");
  const [selectedType, setSelectedType] = useState("crop_stage");
  const [notes, setNotes] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
  const createVerificationRecord = useMutation(api.verification.createVerificationRecord);
  const crops = useQuery(api.crops.getFarmerCrops, { farmerId: farmer._id as any });

  const practiceTypes = [
    { value: "SRI", label: "System of Rice Intensification (SRI)" },
    { value: "Organic", label: "Organic Farming" },
    { value: "Regenerative", label: "Regenerative Agriculture" },
    { value: "Integrated", label: "Integrated Pest Management" },
  ];

  const verificationTypes = [
    { value: "crop_stage", label: "🌱 Crop Growth Stage" },
    { value: "fertilizer_use", label: "🧪 Fertilizer/Compost Application" },
    { value: "irrigation", label: "💧 Irrigation Practice" },
    { value: "harvest", label: "🌾 Harvest Quality" },
    { value: "pest_management", label: "🐛 Pest Management" },
    { value: "soil_health", label: "🌍 Soil Health" },
  ];

  const getCurrentLocation = () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(coords);
            resolve(coords);
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);

    try {
      // Get current location
      let currentLocation = location;
      if (!currentLocation) {
        try {
          currentLocation = await getCurrentLocation();
          toast.success("Location captured");
        } catch (error) {
          toast.error("Could not get location. Using default coordinates.");
          currentLocation = { latitude: 0, longitude: 0 };
        }
      }

      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload image
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Create verification record
      await createVerificationRecord({
        farmerId: farmer._id as any,
        practiceType: selectedPractice,
        verificationType: selectedType,
        imageId: storageId,
        location: currentLocation,
        notes: notes || undefined,
      });

      toast.success("Verification captured! AI analysis in progress...");
      
      // Reset form
      setNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Error capturing verification:", error);
      toast.error("Failed to capture verification");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Capture New Verification</h3>
        <p className="text-gray-600 mb-6">
          Take a photo to verify your sustainable farming practices. Our AI will analyze the image for compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {verificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about this verification..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-4">
          <div className="text-4xl">📸</div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Capture Verification Photo</h4>
            <p className="text-gray-600 mb-4">
              Take a clear photo showing the {verificationTypes.find(t => t.value === selectedType)?.label.replace(/[^\w\s]/gi, '')}
            </p>
            
            {location && (
              <div className="text-sm text-green-600 mb-4">
                📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              disabled={isCapturing}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCapturing}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCapturing ? "Processing..." : "📷 Take Photo"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Verification</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting and clear image quality</li>
          <li>• Include relevant context in the frame</li>
          <li>• Take photos during appropriate times (e.g., irrigation during watering)</li>
          <li>• Enable location services for accurate geo-tagging</li>
        </ul>
      </div>
    </div>
  );
}
