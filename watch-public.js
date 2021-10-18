const esbuild = require('esbuild');
const express = require('express');

esbuild
	.build({
		entryPoints: ['src_example/dev-mapbox-gl-index.ts'],
		// entryPoints: ['src_example/dev-deckgl-index.ts'],

		bundle: true,
		plugins: [],
		loader: { '.woff': 'base64', '.fs': 'text', '.vs': 'text' },
		format: 'iife',
		// https://www.stetic.com/market-share/browser/
		target: ['es2020', 'chrome80', 'safari13', 'edge89', 'firefox70'],

		outfile: 'public/wxtiles/wxtiles.js',
		sourcemap: true,
		minify: false,

		watch: {
			onRebuild(error, result) {
				if (error) {
					console.error('watch build failed:', error);
				} else {
					console.log('rebuilded', new Date());
				}
			},
		},
	})
	.then((result) => {
		const app = express();
		app.use(express.static('public'));

		const PORT = 3004;

		app.get('/watch', function (req, res) {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			});
		});

		const url = `http://localhost:${PORT}`;
		app.listen(PORT, () => {
			console.log(`See example: ${url}`);
		});
	})
	.catch((e) => console.error(e.message));
