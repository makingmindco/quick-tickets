"use client";

import { X } from "lucide-react";

interface LightboxProps {
  url: string | null;
  onClose: () => void;
}

export function Lightbox({ url, onClose }: LightboxProps) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 bg-black/40 rounded-full"
      >
        <X className="h-6 w-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Visualização"
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
