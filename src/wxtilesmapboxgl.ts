import { MapboxLayer } from '@deck.gl/mapbox';
import { Map } from 'mapbox-gl';

import { WxTilesLayerProps, WxTilesLayer, WXLOG } from '@metoceanapi/wxtiles-deckgl';

export class WxTilesLayerManager {
	currentIndex: number = 0;
	layer?: MapboxLayer;
	layerId: string = '';
	beforeLayerId?: string = undefined;

	protected props: WxTilesLayerProps;
	protected map: Map;
	protected cancelNewLayerPromise?: () => void;

	constructor({ map, props, beforeLayerId }: { map: Map; props: WxTilesLayerProps; beforeLayerId: string }) {
		this.map = map;
		this.props = props;
		this.beforeLayerId = beforeLayerId;
	}

	nextTimestep(): Promise<number> {
		WXLOG('nextTimestep');
		return this.goToTimestep(this.currentIndex + 1);
	}

	prevTimestep(): Promise<number> {
		WXLOG('prevTimestep');
		return this.goToTimestep(this.currentIndex - 1);
	}

	cancel() {
		// should be async? - ибо нахер!
		if (this.cancelNewLayerPromise) {
			WXLOG('cancel');
			this.cancelNewLayerPromise();
		}
	}

	remove(): void {
		WXLOG('remove');
		this.cancel();
		this.layer && this.map.removeLayer(this.layerId);
		this.layer = undefined;
	}

	renderCurrentTimestep(): Promise<number> {
		WXLOG('renderCurrentTimestep');
		return this.goToTimestep(this.currentIndex);
	}

	goToTimestep(index: number): Promise<number> {
		WXLOG('goToTimestep:', index);
		this.cancel(); // in case it was busy with the rotten result :( This will remove unwanted layer

		index = this._checkIndex(index);
		if (this.layer && index === this.currentIndex) return Promise.resolve(this.currentIndex); // wait first then check index!!!
		this.currentIndex = index;

		this.layerId = this.props.id; // + index;
		const URI = this.props.wxprops.URITime.replace('{time}', this.props.wxprops.meta.times[index]);

		const props: any = {
			type: WxTilesLayer as any, // is complains on 'wxprops' // TODO: check
			...this.props,
			//id: this.layerId,
			data: URI,
			// onViewportLoad: resolve,
		};

		// const layers = this.map.getStyle().layers;

		if (!this.layer) {
			this.layer = new MapboxLayer(props);
			this.map.addLayer(this.layer, this.beforeLayerId);
		} else {
			// props.visible = false;
			// props.onViewportLoad = () => {
			// 	props.visible = true; //this.props.visible;
			// 	// props.onViewportLoad = this.props.onViewportLoad;
			// 	// props.updateTriggers = {
			// 	// 	visible: true,
			// 	// 	// onViewportLoad: this.props.onViewportLoad,
			// 	// };
			// 	props.updateTriggers = {
			// 		data: URI,
			// 	};
			// 	this.layer?.setProps(props);
			// };
			// props.updateTriggers = {};
			this.layer.setProps(props);
		}

		return Promise.resolve(index);

		// const layers1 = this.map.getStyle().layers;

		// const promise = new Promise<number>((resolve): void => {
		// 	WXLOG('promise:', index, 'started');
		// 	const newInvisibleLayer = new WxTilesLayer({
		// 		...this.props,
		// 		id: layerId,
		// 		data: URI,

		// 		visible: false,

		// 		onViewportLoad: (): void => {
		// 			WXLOG('promise:onViewportLoad:', index);
		// 			// const newVisibleLayer = new WxTilesLayer({ ...this.props, id: layerId, data: URI });
		// 			// this._setFilteredLayers({ remove: newInvisibleLayer, replace: this.layer, add: newVisibleLayer });
		// 			// this.layer = newVisibleLayer;
		// 			this.currentIndex = index;
		// 			this.cancelNewLayerPromise = undefined;
		// 			resolve(this.currentIndex);
		// 		},
		// 	});

		// 	this.cancelNewLayerPromise = () => {
		// 		WXLOG('promise:cancelNewLayerPromise:', index);
		// 		this.cancelNewLayerPromise = undefined;
		// 		resolve(this.currentIndex);
		// 	};

		// 	// this._setFilteredLayers({ add: newInvisibleLayer });
		// 	WXLOG('promise:', index, 'finished');
		// });

		// WXLOG('newLayerByTimeIndexPromise:', index, 'finished');

		// return Promise.resolve(index);
	}

	protected _checkIndex(index: number): number {
		return (index + this.props.wxprops.meta.times.length) % this.props.wxprops.meta.times.length;
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
