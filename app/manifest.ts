import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Windmill Poker",
    short_name: "Windmill Poker",
    description: "Score-Tracker für Windmill Poker",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F2E7CE",
    theme_color: "#1E4A3C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
