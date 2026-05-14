import type { NextConfig } from "next";

const githubRepoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath = configuredBasePath || (process.env.GITHUB_ACTIONS && githubRepoName ? `/${githubRepoName}` : "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
  experimental: {
    workerThreads: false,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
