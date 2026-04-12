"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cameraService } from "@/services/cameraService";

// Leaflet requires window, load dynamically
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function CameraMap() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    cameraService.getMap().then((res) => {
      setCameras((res.data.data || []).filter((c: any) => c.latitude && c.longitude));
    }).catch(() => {});

    // Fix Leaflet default marker icons
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const DefaultIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;
      });
    }
  }, []);

  if (!mounted) return <div className="h-full rounded-lg bg-accent/30" />;

  const center: [number, number] = cameras.length > 0
    ? [Number(cameras[0].latitude), Number(cameras[0].longitude)]
    : [16.0545, 108.2022]; // Da Nang center

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {cameras.map((cam: any) => (
          <Marker key={cam.id} position={[Number(cam.latitude), Number(cam.longitude)]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{cam.name}</p>
                <p className="text-xs">{cam.sourceType} &middot; {cam.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
