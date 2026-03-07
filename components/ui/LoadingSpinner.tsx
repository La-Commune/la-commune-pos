"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: 16, md: 24, lg: 32 };

export default function LoadingSpinner({
  message = "Cargando...",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2
          size={sizeMap[size]}
          className="animate-spin text-accent mx-auto mb-3"
        />
        <p className="text-sm text-text-45">{message}</p>
      </div>
    </div>
  );
}
