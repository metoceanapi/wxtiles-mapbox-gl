const esbuild = require('esbuild');

const sharedConfig = {
	entryPoints: ['src/wxtilesmapboxgl.ts'],
	// outfile: 'dist/es/wxtilesdeckgl.js',
	bundle: true,
	sourcemap: false,
	minify: true,
	// splitting: true,
	treeShaking: true,
	// https://www.stetic.com/market-share/browser/
	target: ['es2020', 'chrome80', 'safari13', 'edge89', 'firefox70'],
	external: ['@deck.gl/mapbox', '@metoceanapi/wxtiles-deckgl'],
};
// BUILD as ESModules
esbuild
	.build({
		...sharedConfig,
		outdir: 'dist/es',
		format: 'esm',
	})
	.catch((e) => console.error(e.message));
// DUILD copy css
esbuild
	.build({
		...sharedConfig,
		external: [],
		entryPoints: ['src/wxtilescss.ts'],
		outdir: '.',
		format: 'esm',
	})
	.then(() => {
		require('fs').unlinkSync('./wxtilescss.js');
	})
	.catch((e) => console.error(e.message));
// build for web
esbuild
	.build({
		...sharedConfig,
		format: 'iife',
		outdir: 'dist/web/',
		globalName: 'wxtilesmapboxgl',
	})
	.catch((e) => console.error(e.message));

// plugins: [
// 	externalGlobalPlugin({
// 		'@deck.gl/core': 'window.deck',
// 		'@deck.gl/layers': 'window.deck',
// 		'@deck.gl/geo-layers': 'window.deck',
// 		'@luma.gl/core': 'window.luma',
// 		'@luma.gl/webgl': 'window.luma',
// 		'@luma.gl/constants': 'window.luma',
// 	}),
// ],
