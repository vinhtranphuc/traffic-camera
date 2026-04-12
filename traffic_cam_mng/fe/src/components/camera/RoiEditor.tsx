"use client";

import { useEffect, useRef, useState } from "react";

interface Point { x: number; y: number }
interface Zone { name: string; polygon: Point[] }

interface Props {
  initialZones?: Zone[];
  backgroundImage?: string;
  width?: number;
  height?: number;
  onChange?: (zones: Zone[]) => void;
}

export default function RoiEditor({ initialZones = [], backgroundImage, width = 640, height = 360, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [current, setCurrent] = useState<Point[]>([]);
  const [zoneName, setZoneName] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawZones(ctx);
      };
      img.src = backgroundImage;
    } else {
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, width, height);
      drawZones(ctx);
    }

    function drawZones(ctx: CanvasRenderingContext2D) {
      // Existing zones
      zones.forEach((z, idx) => {
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
        drawPolygon(ctx, z.polygon, colors[idx % colors.length], z.name);
      });
      // Current in-progress
      if (current.length > 0) drawPolygon(ctx, current, "#ec4899", "Đang vẽ...");
    }

    function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], color: string, label: string) {
      if (points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      if (points.length >= 3) ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillStyle = `${color}33`;
      if (points.length >= 3) ctx.fill();
      ctx.stroke();

      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      if (points.length > 0) {
        ctx.fillStyle = "#fff";
        ctx.font = "12px sans-serif";
        ctx.fillText(label, points[0].x + 8, points[0].y - 8);
      }
    }
  }, [zones, current, backgroundImage, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (height / rect.height));
    setCurrent([...current, { x, y }]);
  };

  const finishZone = () => {
    if (current.length < 3) return;
    const name = zoneName || `Vùng ${zones.length + 1}`;
    const newZones = [...zones, { name, polygon: current }];
    setZones(newZones);
    setCurrent([]);
    setZoneName("");
    onChange?.(newZones);
  };

  const undoPoint = () => setCurrent(current.slice(0, -1));

  const removeZone = (idx: number) => {
    const newZones = zones.filter((_, i) => i !== idx);
    setZones(newZones);
    onChange?.(newZones);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <input
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          placeholder="Tên vùng"
          className="rounded border border-border bg-background px-2 py-1"
        />
        <button type="button" onClick={finishZone} disabled={current.length < 3} className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50">
          Kết thúc vùng ({current.length}/3 điểm)
        </button>
        <button type="button" onClick={undoPoint} disabled={current.length === 0} className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50">
          Hoàn tác điểm
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        className="w-full cursor-crosshair rounded-lg border border-border"
        style={{ aspectRatio: `${width}/${height}` }}
      />

      {zones.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Các vùng đã vẽ:</p>
          {zones.map((z, idx) => (
            <div key={idx} className="flex items-center justify-between rounded bg-accent/50 px-3 py-1 text-sm">
              <span>{z.name} ({z.polygon.length} điểm)</span>
              <button type="button" onClick={() => removeZone(idx)} className="text-xs text-red-500">Xóa</button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Click lên ảnh để thêm điểm. Cần tối thiểu 3 điểm để tạo 1 vùng.
      </p>
    </div>
  );
}
