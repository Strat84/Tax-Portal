/** @type {import('next').NextConfig} */
const nextConfig = {
	trailingSlash: true,
	eslint: {
		// Skip ESLint during `next build` to disable linting for now
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
