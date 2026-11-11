import type { NextConfig } from "next";

// Landing 100% estática: gerada no build (inclusive o QR code) e servida pela
// CDN da Vercel, sem servidor.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
