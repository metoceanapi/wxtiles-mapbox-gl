import { MapboxLayer } from '@deck.gl/mapbox';
import { Map } from 'mapbox-gl';

import { WxTilesLayerProps, WxTilesLayer, WXLOG, createDeckGlLayer, WxTilesLayerManager as WxTilesLayerManagerDeck } from '@metoceanapi/wxtiles-deckgl';
import { Deck } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';

let deck: Deck;
let dummylayer: MapboxLayer<string>;

export class WxTilesLayerManager {
	props: WxTilesLayerProps;
	layer?: MapboxLayer<string>;
	currentIndex: number = 0;
	beforeLayerId?: string = undefined;
	manager: WxTilesLayerManagerDeck;

	private map: Map;

	constructor({ map, props, beforeLayerId }: { map: Map; props: WxTilesLayerProps; beforeLayerId: string }) {
		this.map = map;
		this.props = props;
		this.beforeLayerId = beforeLayerId;

		if (!deck) {
			dummylayer = new MapboxLayer({ id: 'brmrr', type: TextLayer, data: [] as string[] });
			map.addLayer(dummylayer);
			deck = dummylayer.deck;
			deck.props.userData.isExternal = true; // HACk!
		}
		this.manager = createDeckGlLayer(deck, props);
	}

	nextTimestep(): Promise<number> {
		WXLOG('nextTimestep');
		return this.goToTimestep(this.currentIndex + 1);
	}

	prevTimestep(): Promise<number> {
		WXLOG('prevTimestep');
		return this.goToTimestep(this.currentIndex - 1);
	}

	renderCurrentTimestep(): Promise<number> {
		WXLOG('renderCurrentTimestep');
		return this.goToTimestep(this.currentIndex);
	}

	cancel(): void {
		this.manager.cancel();
	}

	remove(): void {
		this.manager.remove();
		this.map.removeLayer(this.props.id);
		this.layer = undefined;
	}

	goToTimestep(index: number): Promise<number> {
		const prom = this.manager.goToTimestep(index);
		prom.then((index: number) => {
			// if (this.currentIndex === index) return;
			if (!this.layer) {
				this.layer = new MapboxLayer({ id: this.props.id, deck });
				this.map.addLayer(this.layer, this.beforeLayerId);
			}

			this.layer.id = this.manager.layer!.props.id;

			this.currentIndex = index;
			// const oldId = this.layer?.id;
			// const id = this.manager.layer!.props.id;
			// this.layer = new MapboxLayer({ id, deck });
			// this.map.addLayer(this.layer, this.beforeLayerId);
			// // // this.map.addLayer(new MapboxLayer({ id: 'my-scatterplot', deck }));
			// setTimeout(() => oldId && this.map.removeLayer(oldId), 100);
		});

		return prom;
	}
}

export function createMapboxLayer(
	map: Map,
	props: WxTilesLayerProps,
	beforeLayerId: string = map.getStyle().layers![map.getStyle().layers!.length - 1].id
): WxTilesLayerManager {
	return new WxTilesLayerManager({ map, props, beforeLayerId });
}

export { WXLOG, setupWxTilesLib, setWxTilesLogging, createWxTilesLayerProps } from '@metoceanapi/wxtiles-deckgl';
export type { WxTilesLayer, WxTilesLayerProps, LibSetupObject, CreateProps, WxServerVarsStyleType } from '@metoceanapi/wxtiles-deckgl';
