import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // これが 404 を解決するリバースプロキシ設定
  async rewrites() {
    return [
      {
        // フロントエンド側で "/api/..." と呼んだら
        source: '/api/:path*',
        // バックエンドの Go サーバー（8080番）に転送する
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;