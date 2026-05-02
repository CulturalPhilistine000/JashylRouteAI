/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { Container } from "../types";

// Fix Leaflet marker icons by removing default image dependencies in favor of custom div icons
L.Marker.prototype.options.icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface WasteMapProps {
  containers: Container[];
  optimizedRoute: Container[];
  center: [number, number];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const getMarkerColor = (fill: number) => {
  if (fill > 80) return "#ef4444"; // Red
  if (fill > 40) return "#f59e0b"; // Amber/Yellow
  return "#22c55e"; // Green
};

export default function WasteMap({ containers, optimizedRoute, center }: WasteMapProps) {
  const routePath = useMemo(() => {
    return optimizedRoute.map((c) => [c.lat, c.lng] as [number, number]);
  }, [optimizedRoute]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={center} />

        {containers.map((container) => {
          const color = getMarkerColor(container.fillLevel);
          const customIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          return (
            <Marker
              key={container.id}
              position={[container.lat, container.lng]}
              icon={customIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1 font-sans">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">Бак</h3>
                  <p className="text-[10px] text-slate-400 font-medium mb-2">{container.address}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-400">СТАТУС</span>
                      <span className={container.fillLevel > 80 ? 'text-red-500' : 'text-slate-600'}>
                        {container.fillLevel}% ЗАПОЛНЕНО
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ 
                          width: `${container.fillLevel}%`,
                          backgroundColor: color
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            color="#2563eb"
            weight={3}
            opacity={0.8}
            className="route-line"
          />
        )}
      </MapContainer>

      {/* Map Overlays */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest space-y-2 z-[1000] shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white" />
          <span>Низкий (&lt;40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-white" />
          <span>Средний (40-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white" />
          <span>Критический (&gt;80%)</span>
        </div>
      </div>
    </div>
  );
}
