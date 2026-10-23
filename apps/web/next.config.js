const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      return [
        {
          source: '/api/backend/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
