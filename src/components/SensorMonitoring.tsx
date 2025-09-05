import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface SensorMonitoringProps {
  farmer: {
    _id: string;
  };
}

export function SensorMonitoring({ farmer }: SensorMonitoringProps) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("24h");

  const sensorData = useQuery(api.sensors.getFarmerSensorData, {
    farmerId: farmer._id as any,
    hours: timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720,
  });

  const satelliteData = useQuery(api.sensors.getLatestSatelliteData, {
    farmerId: farmer._id as any,
  });

  const addSensor = useMutation(api.sensors.addSensor);

  const handleAddSensor = async (sensorType: string) => {
    try {
      await addSensor({
        farmerId: farmer._id as any,
        sensorType,
        sensorId: `${sensorType}_${Date.now()}`,
        location: { latitude: 0, longitude: 0 }, // Would get from GPS
      });
      toast.success(`${sensorType} sensor added successfully!`);
    } catch (error) {
      console.error("Error adding sensor:", error);
      toast.error("Failed to add sensor");
    }
  };

  if (sensorData === undefined || satelliteData === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const sensorTypes = [
    { type: "soil_moisture", icon: "💧", name: "Soil Moisture", unit: "%" },
    { type: "methane", icon: "💨", name: "Methane", unit: "ppm" },
    { type: "temperature", icon: "🌡️", name: "Temperature", unit: "°C" },
    { type: "ph", icon: "⚗️", name: "Soil pH", unit: "pH" },
    { type: "drone", icon: "🚁", name: "Drone Data", unit: "m" },
  ];

  const groupedSensorData = sensorData.reduce((acc, reading) => {
    if (!acc[reading.sensorType]) {
      acc[reading.sensorType] = [];
    }
    acc[reading.sensorType].push(reading);
    return acc;
  }, {} as Record<string, typeof sensorData>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Sensor & Satellite Monitoring</h3>
          <p className="text-gray-600">Real-time IoT sensor data and satellite imagery for MRV</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Satellite Data Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
        <h4 className="text-lg font-semibold mb-4">🛰️ Latest Satellite Data</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-blue-100 text-sm">NDVI</div>
            <div className="text-2xl font-bold">{satelliteData?.ndvi?.toFixed(3) || "N/A"}</div>
            <div className="text-xs text-blue-100">Vegetation Index</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-blue-100 text-sm">Soil Moisture</div>
            <div className="text-2xl font-bold">{satelliteData?.soilMoisture?.toFixed(1) || "N/A"}%</div>
            <div className="text-xs text-blue-100">Surface Level</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-blue-100 text-sm">Biomass</div>
            <div className="text-2xl font-bold">{satelliteData?.biomass?.toFixed(1) || "N/A"}</div>
            <div className="text-xs text-blue-100">kg/m²</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-blue-100 text-sm">Last Update</div>
            <div className="text-sm font-bold">
              {satelliteData?.acquisitionDate 
                ? new Date(satelliteData.acquisitionDate).toLocaleDateString()
                : "N/A"
              }
            </div>
            <div className="text-xs text-blue-100">Sentinel-2</div>
          </div>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensorTypes.map((sensor) => {
          const readings = groupedSensorData[sensor.type] || [];
          const latestReading = readings[0];
          const hasData = readings.length > 0;

          return (
            <div key={sensor.type} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sensor.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{sensor.name}</h4>
                    <p className="text-sm text-gray-600">{readings.length} readings</p>
                  </div>
                </div>
                {!hasData && (
                  <button
                    onClick={() => handleAddSensor(sensor.type)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                  >
                    Add Sensor
                  </button>
                )}
              </div>

              {hasData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {latestReading.readings.value.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">{sensor.unit}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      latestReading.readings.quality === "good" ? "bg-green-100 text-green-800" :
                      latestReading.readings.quality === "fair" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {latestReading.readings.quality || "good"}
                    </div>
                  </div>

                  {/* Simple trend visualization */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Last 24h trend</div>
                    <div className="flex items-end gap-1 h-12">
                      {readings.slice(0, 12).reverse().map((reading, index) => {
                        const maxValue = Math.max(...readings.map(r => r.readings.value));
                        const height = (reading.readings.value / maxValue) * 100;
                        return (
                          <div
                            key={index}
                            className="bg-green-500 rounded-t flex-1 min-h-1"
                            style={{ height: `${height}%` }}
                            title={`${reading.readings.value} ${sensor.unit}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last reading: {new Date(latestReading.timestamp).toLocaleString()}
                  </div>

                  {latestReading.metadata && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {latestReading.metadata.batteryLevel && (
                        <div>
                          <span className="text-gray-600">Battery:</span>
                          <span className="ml-1 font-medium">{latestReading.metadata.batteryLevel}%</span>
                        </div>
                      )}
                      {latestReading.metadata.signalStrength && (
                        <div>
                          <span className="text-gray-600">Signal:</span>
                          <span className="ml-1 font-medium">{latestReading.metadata.signalStrength}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No sensor connected</div>
                  <p className="text-xs text-gray-500">Add a {sensor.name.toLowerCase()} sensor to start monitoring</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LoRaWAN Network Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📡 LoRaWAN Network Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Online</div>
            <div className="text-sm text-gray-600">Network Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Object.keys(groupedSensorData).length}</div>
            <div className="text-sm text-gray-600">Active Sensors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">-85 dBm</div>
            <div className="text-sm text-gray-600">Signal Strength</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">15 min</div>
            <div className="text-sm text-gray-600">Update Interval</div>
          </div>
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Data Quality & MRV Impact</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Sensor Data Coverage</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <span className="text-sm font-medium">75%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Satellite Data Frequency</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "60%" }}></div>
              </div>
              <span className="text-sm font-medium">60%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">MRV Confidence Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
              <span className="text-sm font-medium">85%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>High-quality MRV data detected!</strong> Your sensor and satellite data coverage qualifies for premium carbon credit pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
