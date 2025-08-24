/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three']
  },
  webpack: (config) => {
    // Handle .glb, .gltf, and .hdr files as static assets
    config.module.rules.push({
      test: /\.(glb|gltf|hdr)$/,
      type: 'asset/resource'
    });
    return config;
  }
};

export default nextConfig;
