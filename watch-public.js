const esbuild = require('esbuild');
// const sassPlugin = require('esbuild-plugin-sass');
const express = require('express');

let watchResponse;
const disableHotReload = process.env.DISABLE_HOT_RELOAD === 'true';

esbuild
	.build({
		entryPoints: ['src/index.ts'],
		bundle: true,
		// plugins: [sassPlugin()],
		loader: {
			'.ttf': 'base64',
			'.woff': 'base64',
			'.fs': 'text',
			'.vs': 'text',
		},
		// target: 'es2017',
		format: 'iife',
		outfile: 'public/wxtilesmapbox/wxtilesmapbox.js',
		globalName: 'wxtilesmapbox',
		sourcemap: true,
		// minify: false,
		watch: {
			onRebuild(error, result) {
				if (error) {
					console.error('watch build failed:', error);
				} else {
					console.log('rebuilded', new Date());
					!disableHotReload && watchResponse && watchResponse.write('data: refresh\n\n');
				}
			},
		},
	})
	.then((result) => {
		const app = express();
		app.use(express.static('public'));

		const PORT = 3005;

		app.get('/watch', function (req, res) {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			});
		});

		const url = `http://0.0.0.0:${PORT}`;
		app.listen(PORT, () => {
			console.log(`Dev is running at ${url}`);
		});
	})
	.catch((e) => console.error(e.message));
