"use client";

import { useMapEvents } from "react-leaflet";

interface Props {
  onClick: (latlng: { lat: number; lng: number }) => void;
}

export default function MapEvents({ onClick }: Props) {
  useMapEvents({
    click: (e) => onClick(e.latlng),
  });
  return null;
}
