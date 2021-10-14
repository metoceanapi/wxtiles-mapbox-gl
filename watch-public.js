const esbuild = require('esbuild');
const express = require('express');

// let watchResponse;
// const disableHotReload = process.env.DISABLE_HOT_RELOAD === 'true';

esbuild
	.build({
		entryPoints: ['src/wxtiles-mapbox-gl.ts'],
		bundle: true,
		plugins: [],
		loader: {
			'.ttf': 'base64',
			'.woff': 'base64',
			'.fs': 'text',
			'.vs': 'text',
		},
		// target: 'es6',
		format: 'iife',
		outdir: 'public/wxtiles-gl',
		globalName: 'wxtilesGl',
		sourcemap: true,
		// minify: false,
		watch: {
			onRebuild(error, result) {
				if (error) {
					console.error('watch build failed:', error);
				} else {
					console.log('rebuilded', new Date());
					// !disableHotReload && watchResponse && watchResponse.write('data: refresh\n\n');
				}
			},
		},
	})
	.then((result) => {
		const app = express();
		app.use(express.static('public'));

		const PORT = 3002;

		app.get('/watch', function (req, res) {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			});
		});

		const url = `http://localhost:${PORT}`;
		app.listen(PORT, () => {
			console.log(`Dev is running at ${url}`);
		});
	})
	.catch((e) => console.error(e.message));
