import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { FarmerSetup } from "./components/FarmerSetup";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">🌱</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Soil-to-Sky MRV</h2>
            <p className="text-xs text-gray-600">Carbon Credit Grid</p>
          </div>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const farmerProfile = useQuery(api.farmers.getFarmerProfile);

  if (loggedInUser === undefined || farmerProfile === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Unauthenticated>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="text-6xl mb-4">🌱🛰️</div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Soil-to-Sky MRV Grid
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Monitor, Report & Verify Carbon Credits in Agroforestry & Rice Farming
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                <div className="text-3xl mb-3">🌾</div>
                <div className="text-green-700 font-semibold mb-2">Smart Farming MRV</div>
                <div className="text-gray-600 text-sm">AI-powered monitoring of rice & agroforestry practices</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="text-3xl mb-3">🛰️</div>
                <div className="text-blue-700 font-semibold mb-2">Satellite Integration</div>
                <div className="text-gray-600 text-sm">Real-time satellite data for carbon sequestration</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                <div className="text-3xl mb-3">💰</div>
                <div className="text-purple-700 font-semibold mb-2">Carbon Credits</div>
                <div className="text-gray-600 text-sm">Automated calculation & blockchain registry</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="text-3xl mb-3">🤝</div>
                <div className="text-orange-700 font-semibold mb-2">Community Nodes</div>
                <div className="text-gray-600 text-sm">Cooperative MRV for farmer groups</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Monitor</h4>
                  <p className="text-gray-600 text-sm">Log farming activities, connect IoT sensors, capture drone imagery</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Verify</h4>
                  <p className="text-gray-600 text-sm">AI analyzes satellite + sensor data for carbon sequestration</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💎</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Earn</h4>
                  <p className="text-gray-600 text-sm">Generate verified carbon credits and earn from sustainable practices</p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {!farmerProfile ? (
          <FarmerSetup />
        ) : (
          <Dashboard farmer={farmerProfile} />
        )}
      </Authenticated>
    </div>
  );
}
