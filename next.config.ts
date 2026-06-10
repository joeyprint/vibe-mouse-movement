import type { NextConfig } from "next";

const repositoryName = "vibe-mouse-movement";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? `/${repositoryName}` : "",
  images: { unoptimized: true },
};

export default nextConfig;
