import mapboxgl from 'mapbox-gl';
import { Map } from 'mapbox-gl';

import { setupWxTilesLib, createWxTilesLayerProps, WxServerVarsStyleType, createMapboxLayer, WxTilesLayerManager } from './createMapboxLayer';

mapboxgl.accessToken = 'pk.eyJ1IjoibWV0b2NlYW4iLCJhIjoia1hXZjVfSSJ9.rQPq6XLE0VhVPtcD9Cfw6A';

(async () => {
	const map = new Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v9',
		center: [175, -40],
		zoom: 7,
	});

	await setupWxTilesLib();

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

		const params: WxServerVarsStyleType = ['obs-radar.rain.nzl.national', 'reflectivity', 'rain.EWIS'];
		// ['ecwmf.global', ['wind.speed.eastward.at-10m', 'wind.speed.northward.at-10m'], 'Wind Speed2'];
		// ['ecwmf.global', 'air.temperature.at-2m', 'Sea Surface Temperature'];
		const extraParams = {
			// DeckGl layer's common parameters
			opacity: 0.5,
			// event hook
			onClick(info: any, pickingEvent: any): void {
				console.log(info?.layer?.onClickProcessor?.(info, pickingEvent) || info);
			},
		};

		const wxProps = await createWxTilesLayerProps({ server: 'https://tiles.metoceanapi.com/data/', params, extraParams });

		const layerManager = createMapboxLayer(map, wxProps);
		// or
		// const layerManager = new WxTilesLayerManager({ deckgl, props: wxProps });

		await layerManager.renderCurrentTimestep();

		UIhooks(layerManager);
	});
})();

function UIhooks(layerManager: WxTilesLayerManager) {
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
