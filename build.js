const esbuild = require('esbuild');
// const sassPlugin = require('esbuild-plugin-sass');

const sharedConfig = {
	entryPoints: ['src/wxtiles-mapbox-gl.ts'],
	bundle: true,
	// plugins: [sassPlugin()],
	loader: {
		'.ttf': 'base64',
		'.woff': 'base64',
		'.fs': 'text',
		'.vs': 'text',
	},
	// https://www.stetic.com/market-share/browser/
	target: ['es2020', 'chrome80', 'safari13', 'edge89', 'firefox70'],
	minify: true,
};

// BUILD as ESModules
esbuild
	.build({
		...sharedConfig,
		format: 'esm',
		outfile: 'dist/es/bundle.js',
	})
	.catch((e) => console.error(e.message));

// build for web
esbuild
	.build({
		...sharedConfig,
		format: 'iife',
		outfile: 'dist/web/wxtiledeckgl.js',
		globalName: 'wxtilesGl',
	})
	.catch((e) => console.error(e.message));
