import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Vercel tiene un tope duro de 4.5MB por request en Serverless
    // Functions que Next.js no puede subir — este valor solo alinea el
    // límite de Next con ese techo real de la plataforma.
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
