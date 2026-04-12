"use client";

import { forwardRef, InputHTMLAttributes, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onSearch: (value: string) => void;
  debounceMs?: number;
  initialValue?: string;
}

const SearchInput = forwardRef<HTMLInputElement, Props>(
  ({ onSearch, debounceMs = 300, initialValue = "", className, placeholder = "Tìm kiếm...", ...rest }, ref) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      const t = setTimeout(() => onSearch(value), debounceMs);
      return () => clearTimeout(t);
    }, [value, debounceMs, onSearch]);

    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-9 text-sm transition-colors focus:border-primary focus:outline-none"
          {...rest}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
