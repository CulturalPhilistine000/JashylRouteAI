/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, 
  Container as ContainerIcon, 
  Map as MapIcon, 
  Navigation, 
  RefreshCcw, 
  Trash2, 
  TrendingUp, 
  AlertTriangle 
} from "lucide-react";
import { useEffect, useState, useMemo, ReactNode } from "react";
import WasteMap from "./components/WasteMap";
import { Container, RouteStats } from "./types";
import { generateSimulatedContainers, optimizeRoute, getDistance } from "./utils/geo";

const BISHKEK_CENTER: [number, number] = [42.8746, 74.5698];
const FILL_THRESHOLD = 60;
const SIMULATION_INTERVAL = 3000; // Increase fill every 3s

export default function App() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<Container[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [lastOptimized, setLastOptimized] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(BISHKEK_CENTER);

  // Initialize data
  useEffect(() => {
    setContainers(generateSimulatedContainers(100));
  }, []);

  // Simulate fill over time
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setContainers((prev) =>
        prev.map((c) => ({
          ...c,
          fillLevel: Math.min(100, c.fillLevel + Math.floor(Math.random() * 5)),
          lastUpdated: Date.now(),
        }))
      );
    }, SIMULATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleContainerClick = (c: Container) => {
    setMapCenter([c.lat, c.lng]);
  };

  const stats = useMemo(() => {
    const full = containers.filter(c => c.fillLevel >= FILL_THRESHOLD).length;
    const avgFill = containers.length > 0 
      ? Math.round(containers.reduce((acc, c) => acc + c.fillLevel, 0) / containers.length)
      : 0;
    const critical = containers.filter(c => c.fillLevel > 90).length;

    return { full, avgFill, critical };
  }, [containers]);

  const routeStats = useMemo((): RouteStats | null => {
    if (optimizedRoute.length < 2) return null;
    
    let totalDist = 0;
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      totalDist += getDistance(
        optimizedRoute[i].lat, 
        optimizedRoute[i].lng, 
        optimizedRoute[i+1].lat, 
        optimizedRoute[i+1].lng
      );
    }
    
    return {
      totalDistance: Math.round(totalDist * 10) / 10,
      optimizedCount: optimizedRoute.length,
      estimatedTime: Math.round(totalDist * 5), // Assuming 12km/h avg speed including stops
    };
  }, [optimizedRoute]);

  const handleOptimize = () => {
    const toCollect = containers.filter(c => c.fillLevel >= FILL_THRESHOLD);
    const route = optimizeRoute(toCollect, { lat: BISHKEK_CENTER[0], lng: BISHKEK_CENTER[1] });
    setOptimizedRoute(route);
    setLastOptimized(Date.now());
  };

  const handleUpdateLevel = (id: string, level: number) => {
    setContainers(prev => prev.map(c => c.id === id ? { ...c, fillLevel: level } : c));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 p-4 md:p-6 lg:h-screen lg:overflow-hidden flex flex-col">
      <header className="max-w-[1400px] w-full mx-auto mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">JashylRouteAI</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Умная система сбора мусора</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex gap-2 border-l border-slate-100 pl-6">
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-2 rounded-lg border transition-all ${
                isSimulating 
                  ? "bg-blue-50 text-blue-600 border-blue-200" 
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              }`}
              title={isSimulating ? "Пауза симуляции" : "Запуск симуляции"}
            >
              <RefreshCcw className={`w-4 h-4 ${isSimulating ? "animate-spin-slow" : ""}`} />
            </button>
            <button 
              onClick={handleOptimize}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Оптимизировать маршрут
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Sidebar: Route Queue */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Маршрутный лист</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {routeStats ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-center mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-center">
                    <p className="text-[10px] text-blue-400 uppercase font-bold">Расстояние</p>
                    <p className="text-sm font-bold text-blue-700">{routeStats.totalDistance}км</p>
                  </div>
                </div>
                {optimizedRoute.map((c, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={c.id} 
                    onClick={() => handleContainerClick(c)}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 text-xs tracking-tight truncate">Бак</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.address}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${c.fillLevel > 80 ? 'bg-red-500 animate-pulse' : c.fillLevel > 50 ? 'bg-amber-500' : 'bg-green-500'}`} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center px-8 text-slate-400 italic text-xs leading-relaxed">
                Нажмите "оптимизировать маршрут" для построения маршрута
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Map & Quick Stats */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
            <WasteMap 
              containers={containers} 
              optimizedRoute={optimizedRoute} 
              center={mapCenter}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <QuickStat icon={<ContainerIcon className="w-4 h-4" />} label="Охват баков" value={containers.length} />
            <QuickStat icon={<AlertTriangle className="w-4 h-4" />} label="Требуют вывоза" value={stats.critical} color="text-red-500" />
            <QuickStat icon={<BarChart3 className="w-4 h-4" />} label="общая заполненность" value={`${stats.avgFill}%`} color="text-blue-600" />
            <QuickStat icon={<TrendingUp className="w-4 h-4" />} label="не требуют очистки" value={containers.filter(c => c.fillLevel < 40).length} color="text-green-500" />
            <QuickStat icon={<MapIcon className="w-4 h-4" />} label="Регион" value="Бишкек" />
          </div>
        </div>
      </main>

      <footer className="max-w-[1400px] w-full mx-auto mt-4 pb-4 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <p>(c) 2026 KLANKAGANA ТАЗАЛЫК</p>
      </footer>

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

function QuickStat({ icon, label, value, color = "text-slate-600" }: { icon: ReactNode, label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className={`text-base font-bold leading-none ${color}`}>{value}</p>
      </div>
    </div>
  );
}
