"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

function calcStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/\d/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ showStrength = false, value, className, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const pwd = String(value ?? "");
    const strength = calcStrength(pwd);

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            value={value}
            className={className ?? "w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {showStrength && pwd.length > 0 && (
          <div className="mt-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded transition ${
                    i < strength ? strengthColors[strength] : "bg-accent"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Độ mạnh: {strengthLabels[strength]}
              {pwd.length < 8 && " (tối thiểu 8 ký tự)"}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
