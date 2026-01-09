/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	trailingSlash: true,
	eslint: {
		// Skip ESLint during `next build` to disable linting for now
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
