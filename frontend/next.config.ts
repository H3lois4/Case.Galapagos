import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  /* opções do Next aqui */
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Desliga o SW em desenvolvimento para não cachear durante o dev.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
