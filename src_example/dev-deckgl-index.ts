import { Deck, MapView } from '@deck.gl/core';

import {
	setupWxTilesLib,
	setWxTilesLogging,
	createWxTilesLayerProps,
	createDeckGlLayer,
	WxServerVarsStyleType,
	DebugTilesLayer,
	CreateProps,
	LibSetupObject,
	WxTilesLayerManager,
	WxTilesLayer,
} from '@metoceanapi/wxtiles-deckgl';
import '@metoceanapi/wxtiles-deckgl/dist/es/wxtilesdeckgl.css';

import colorStyles from './styles/styles.json';
import units from './styles/uconv.json';
import colorSchemes from './styles/colorschemes.json';

async function start() {
	// ESSENTIAL step to get lib ready.
	const wxlibCustomSettings: LibSetupObject = {
		colorStyles: colorStyles as any,
		units: units as any,
		colorSchemes,
	};
	await setupWxTilesLib(wxlibCustomSettings); // !!! IMPORTANT: await to make sure fonts (barbs, arrows, etc) are loaded
	setWxTilesLogging(true); // logging on

	const params: WxServerVarsStyleType =
		['obs-radar.rain.nzl.national', 'reflectivity', 'rain.EWIS'];
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

	const deckgl = new Deck({
		initialViewState: { latitude: -38, longitude: 176, zoom: 4 },
		controller: true,
		parent: document.getElementById('map')!,
		views: [new MapView({ repeat: true })],
		layers: [],
	});

	const layerManager = createDeckGlLayer(deckgl, wxProps);
	// or
	// const layerManager = new WxTilesLayerManager({ deckgl, props: wxProps });

	await layerManager.renderCurrentTimestep();
	
	UIhooks(layerManager);
	debugLayers(deckgl, wxProps.maxZoom);
}

function debugLayers(deckgl: Deck, maxZoom?: number) {
	const debugLayerRed = new DebugTilesLayer({
		id: 'debugtilesR',
		data: { color: [255, 0, 0, 120] },
	});
	const debugLayerBlue = new DebugTilesLayer({
		id: 'debugtilesB',
		data: { color: [0, 0, 255, 120] },
		maxZoom,
	});

	deckgl.setProps({ layers: [...deckgl.props.layers, debugLayerRed, debugLayerBlue] });
}

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

start();
