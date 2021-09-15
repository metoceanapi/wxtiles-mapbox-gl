const esbuild = require('esbuild');

// build for web
esbuild
	.build({
		entryPoints: ['src/index.ts'],
		bundle: true,
		plugins: [],
		loader: {
			'.ttf': 'base64',
			'.woff': 'base64',
			'.fs': 'text',
			'.vs': 'text',
		},
		target: ['es2020', 'chrome80', 'safari13', 'edge89', 'firefox70'],
		format: 'iife',
		outfile: 'dist/web/script.js',
		globalName: 'script',
		sourcemap: false,
		minify: true,
	})
	.catch((e) => console.error(e.message));
