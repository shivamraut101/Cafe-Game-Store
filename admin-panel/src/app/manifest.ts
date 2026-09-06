import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ForStore - Cafe Loyalty & Counter Portal",
    short_name: "ForStore",
    description: "White-label cafe loyalty minigames and staff counter voucher redemption portal.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F3EB",
    theme_color: "#111111",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
