import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ToDo size limit
  // serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
