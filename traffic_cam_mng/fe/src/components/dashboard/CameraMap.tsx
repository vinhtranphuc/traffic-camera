"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cameraService } from "@/services/cameraService";
import { STATUS_META } from "@/components/shared/StatusBadge";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function CameraMap() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    cameraService.getMap()
      .then((res) => {
        setCameras((res.data.data || []).filter((c: any) => c.latitude && c.longitude));
      })
      .catch(() => {});
  }, []);

  if (!mounted) return <div className="h-full rounded-lg bg-accent/30" />;

  const center: [number, number] = cameras.length > 0
    ? [Number(cameras[0].latitude), Number(cameras[0].longitude)]
    : [16.0545, 108.2022];

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {cameras.map((cam: any) => {
          const meta = STATUS_META[cam.status as keyof typeof STATUS_META] || STATUS_META.OFFLINE;
          return (
            <CircleMarker
              key={cam.id}
              center={[Number(cam.latitude), Number(cam.longitude)]}
              radius={8}
              pathOptions={{ color: meta.color, fillColor: meta.color, fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{cam.name}</p>
                  <p className="text-xs">{cam.sourceType} &middot; <span style={{ color: meta.color }}>{cam.status}</span></p>
                  <a href={`/cameras/${cam.id}`} className="text-xs text-blue-500 hover:underline">Xem chi tiết →</a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
