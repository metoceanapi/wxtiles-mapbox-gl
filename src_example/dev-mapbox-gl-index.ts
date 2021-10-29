// MAPBOX
import 'mapbox-gl/dist/mapbox-gl.css'; // CSS
import mapboxgl from 'mapbox-gl';
// WXTILES
import {
	setupWxTilesLib,
	createWxTilesLayerProps,
	WxServerVarsStyleType,
	createMapboxLayer,
	setWxTilesLogging,
	LibSetupObject,
	WxTilesLayerManager,
	WxGetColorStyles,
	createLegend,
} from '../src/wxtilesmapboxgl';
import '../wxtilescss.css'; // CSS
// JSON custom Wxtiles setting
import colorStyles from './styles/styles.json';
import units from './styles/uconv.json';
import colorSchemes from './styles/colorschemes.json';

mapboxgl.accessToken = 'pk.eyJ1IjoibWV0b2NlYW4iLCJhIjoia1hXZjVfSSJ9.rQPq6XLE0VhVPtcD9Cfw6A';

(async () => {
	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v9',
		center: [175, -40],
		zoom: 3,
	});

	map.on('load', async () => {
		// Classic mapbox layers
		map.addSource('pointLayerSource', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.52, 40],
						},
						properties: {
							name: 'my point hehe',
						},
					},
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [-74.46, 40],
						},
						properties: {
							name: 'Boo',
						},
					},
				],
			},
		});

		map.addLayer({
			id: 'pointLayer',
			type: 'symbol',
			source: 'pointLayerSource',
			layout: {
				// 'icon-image': { property: 'icon', type: 'identity' },
				'icon-image': 'star-11', // "circle-stroked-15",
				'icon-size': 1,
				'icon-allow-overlap': true,
				'icon-ignore-placement': false,
				'icon-padding': 1,
				'icon-optional': false,
				'text-field': '{name}',
				'text-anchor': 'top',
				'text-offset': [0, 1],
				'text-optional': true,
				'text-font': ['Lato Bold', 'Arial Unicode MS Bold'],
				'text-size': {
					stops: [
						[0, 0],
						[3, 0],
						[3.0001, 13],
					], // Sudden grow effect from 0 to 13pt at zoom 3
				},
				'text-letter-spacing': 0.05,
				'text-line-height': 1,
			},
			paint: {
				'text-halo-color': '#303030',
				'text-color': '#F5F5F5',
				'text-halo-width': 1.5,
				'text-halo-blur': 1,
			},
		});

		addWxTilesLayer(map);
	});
})();

async function addWxTilesLayer(map: mapboxgl.Map) {
	setWxTilesLogging(true); // logging on
	// ESSENTIAL step to get lib ready.
	const wxlibCustomSettings: LibSetupObject = {
		colorStyles: colorStyles as any,
		units: units as any,
		colorSchemes,
	};
	await setupWxTilesLib(wxlibCustomSettings); // !!! IMPORTANT: await to make sure fonts (barbs, arrows, etc) are loaded

	const params: WxServerVarsStyleType =
		// ['ecwmf.global', ['wind.speed.eastward.at-10m', 'wind.speed.northward.at-10m'], 'Wind Speed2'];
		['ecwmf.global', 'air.temperature.at-2m', 'Sea Surface Temperature'];
	// ['obs-radar.rain.nzl.national', 'reflectivity', 'rain.EWIS'];
	const extraParams = {
		// DeckGl layer's common parameters or hooks
		opacity: 0.5,
		// event hook
		onClick(info: any, pickingEvent: any): void {
			console.log(info?.layer?.onClickProcessor?.(info, pickingEvent) || info);
		},
	};

	const wxProps = await createWxTilesLayerProps({ server: 'https://tiles.metoceanapi.com/data/', params, extraParams });

	const layerManager = createMapboxLayer(map, wxProps);
	// or
	// const layerManager = new WxTilesLayerManager({ map, props: wxProps,beforeLayerId });
	await layerManager.nextTimestep();

	// const params2: WxServerVarsStyleType = ['ecwmf.global', ['wind.speed.eastward.at-10m', 'wind.speed.northward.at-10m'], 'Wind Speed2'];
	// const wxProps2 = await createWxTilesLayerProps({ server: 'https://tiles.metoceanapi.com/data/', params: params2, extraParams });
	// const layerManager2 = createMapboxLayer(map, wxProps2);
	// await layerManager2.nextTimestep();

	UIhooks(layerManager);

	const legendCanvasEl = document.getElementById('legend') as HTMLCanvasElement;
	if (!legendCanvasEl) return;

	const style = WxGetColorStyles()[params[2]];
	const legend = createLegend(legendCanvasEl.width - 50, style);

	const txt = params[2] + ' (' + legend.units + ')';
	drawLegend({ legend, txt, canvas: legendCanvasEl });
}

function UIhooks(layerManager) {
	// set up user interface
	const nextButton = document.getElementById('next');
	const prevButton = document.getElementById('prev');
	const playButton = document.getElementById('play');
	const removeButton = document.getElementById('remove');
	removeButton?.addEventListener('click', () => layerManager.remove());
	nextButton?.addEventListener('click', () => layerManager.nextTimestep());
	prevButton?.addEventListener('click', () => layerManager.prevTimestep());
	let isPlaying = false;
	const play = async () => {
		do {
			await layerManager.nextTimestep();
		} while (isPlaying);
	};
	playButton?.addEventListener('click', () => {
		layerManager.cancel();
		isPlaying = !isPlaying;
		isPlaying && play();
		playButton.innerHTML = isPlaying ? 'Stop' : 'Play';
	});
}

function drawLegend({ legend, canvas, txt }) {
	if (!canvas || !legend) return;

	const { width, height } = canvas;
	const halfHeight = (16 + height) >> 2;

	// draw legend
	const ctx = canvas.getContext('2d');
	const imData = ctx.createImageData(width, height);
	const im = new Uint32Array(imData.data.buffer);
	im.fill(-1);

	const startX = 2;
	const startY = 2;
	const startXY = startX + width * startY;

	const trSize = halfHeight >> 1;
	// left triangle
	if (legend.showBelowMin) {
		const c = legend.colors[0];
		if (c) {
			for (let x = 0; x < trSize; ++x) {
				for (let y = trSize; y < trSize + x; ++y) {
					im[startXY + x + y * width] = c;
					im[startXY + x + (trSize * 2 - y) * width] = c;
				}
			}
		}
	}

	for (let x = 0; x < legend.size; ++x) {
		for (let y = 0; y < halfHeight; ++y) {
			if (legend.colors[0]) {
				im[startX + x + trSize + (y + startY + 1) * width] = legend.colors[x];
			}
		}
	}

	// right triangle
	if (legend.showAboveMax) {
		const c = legend.colors[legend.colors.length - 1];
		if (c) {
			for (let x = 0; x <= trSize; ++x) {
				for (let y = trSize; y < trSize + x; ++y) {
					im[startXY + trSize * 2 + legend.size - x + y * width] = c;
					im[startXY + trSize * 2 + legend.size - x + (trSize * 2 - y) * width] = c;
				}
			}
		}
	}

	ctx.putImageData(imData, 0, 0);

	// draw ticks
	ctx.font = '8px sans-serif';
	ctx.beginPath();
	for (const tick of legend.ticks) {
		ctx.strokeStyle = '#000';
		ctx.moveTo(tick.pos + trSize + startX + 1, startY + 3);
		ctx.lineTo(tick.pos + trSize + startX + 1, halfHeight);
		ctx.fillText(tick.dataString, tick.pos + trSize + startX + 1, halfHeight + 11);
	}
	ctx.font = '12px sans-serif';
	ctx.fillText(txt, 13, height - 5);
	ctx.stroke();

	ctx.strokeStyle = '#888';
	ctx.strokeRect(1, 1, width - 3, height - 2); //for white background
}
