"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, LocateFixed } from "lucide-react";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const UseMapEvents = dynamic(() => import("./MapEvents"), { ssr: false });

interface Props {
  lat?: string;
  lng?: string;
  onChange: (lat: string, lng: string) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<[number, number] | null>(
    lat && lng ? [parseFloat(lat), parseFloat(lng)] : null
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      });
    }
  }, []);

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    const newPos: [number, number] = [latlng.lat, latlng.lng];
    setPos(newPos);
    onChange(latlng.lat.toFixed(7), latlng.lng.toFixed(7));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const newPos: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(newPos);
        onChange(p.coords.latitude.toFixed(7), p.coords.longitude.toFixed(7));
      },
      () => {}
    );
  };

  if (!mounted) return <div className="h-64 rounded-lg bg-accent/30" />;

  const center: [number, number] = pos || [16.0545, 108.2022];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Click vào bản đồ để chọn vị trí
        </p>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          <LocateFixed className="h-3 w-3" aria-hidden="true" />
          Vị trí hiện tại
        </button>
      </div>
      <div className="h-64 overflow-hidden rounded-lg border border-border">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <UseMapEvents onClick={handleMapClick} />
          {pos && <Marker position={pos} />}
        </MapContainer>
      </div>
      {pos && (
        <p className="text-xs text-muted-foreground">
          Đã chọn: {pos[0].toFixed(5)}, {pos[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
