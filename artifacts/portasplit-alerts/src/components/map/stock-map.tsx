import * as React from "react";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { StockMapPoint } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Navigation } from "lucide-react";

// Fix missing Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_COLORS = {
  in_stock: "#22c55e",
  low_stock: "#f59e0b",
  out_of_stock: "#6b7280",
  reserved: "#f97316",
};

interface StockMapProps {
  points: StockMapPoint[];
}

// Automatically fit bounds to points
function MapBounds({ points }: { points: StockMapPoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!points || points.length === 0) return;
    
    // Default to France if points somehow don't have valid coords
    const validPoints = points.filter(p => p.lat != null && p.lng != null);
    if (validPoints.length === 0) return;
    
    const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
    // Add some padding
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [points, map]);

  return null;
}

export function StockMap({ points }: StockMapProps) {
  // Center on France by default
  const defaultCenter: [number, number] = [46.2276, 2.2137];
  
  return (
    <div className="relative h-full w-full bg-muted overflow-hidden rounded-xl border border-border ring-1 ring-border/50">
      <div className="absolute top-4 right-4 z-[400] bg-background/90 backdrop-blur border border-border text-xs font-mono px-3 py-2 rounded-md shadow-sm pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> En stock
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Stock faible
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Réservé
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6b7280]"></span> Épuisé
        </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapBounds points={points} />

        {points.map((point) => (
          <CircleMarker
            key={point.storeId}
            center={[point.lat, point.lng]}
            radius={point.status === 'out_of_stock' ? 4 : 6}
            pathOptions={{
              fillColor: STATUS_COLORS[point.status as keyof typeof STATUS_COLORS],
              color: point.status === 'out_of_stock' ? 'transparent' : 'white',
              weight: 1,
              fillOpacity: point.status === 'out_of_stock' ? 0.4 : 0.9,
            }}
          >
            <Popup className="font-sans">
              <div className="space-y-2 pb-1 min-w-[200px]">
                <div>
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">{point.chain}</div>
                  <h3 className="font-bold text-sm leading-tight">{point.name}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {point.city}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <StatusBadge status={point.status} />
                  {point.stockQty != null && point.status !== 'out_of_stock' && (
                    <span className="text-xs font-mono font-medium">Qté : {point.stockQty}</span>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
