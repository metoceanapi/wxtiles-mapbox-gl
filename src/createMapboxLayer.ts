export {
	setupWxTilesLib,
	setWxTilesLogging,
	createWxTilesLayerProps,
	LibSetupObject,
	WxTilesLayerProps,
	CreateProps,
	WxServerVarsStyleType,
	WxTilesLayer,
	WXLOG,
} from '@metoceanapi/wxtiles-deckgl';

import { MapboxLayer } from '@deck.gl/mapbox';
import { Map } from 'mapbox-gl';
import {
	setupWxTilesLib,
	setWxTilesLogging,
	createWxTilesLayerProps,
	LibSetupObject,
	WxTilesLayerProps,
	CreateProps,
	WxServerVarsStyleType,
	WxTilesLayer,
	WXLOG,
} from '@metoceanapi/wxtiles-deckgl';

export class WxTilesLayerManager {
	props: WxTilesLayerProps;
	map: Map;
	currentIndex: number = 0;
	layerId?: string;
	beforeLayerId?: string = undefined;

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
		this.layerId && this.map.removeLayer(this.layerId);
		this.layerId = undefined;
	}

	renderCurrentTimestep(): Promise<number> {
		WXLOG('renderCurrentTimestep');
		return this.goToTimestep(this.currentIndex);
	}

	goToTimestep(index: number): Promise<number> {
		WXLOG('goToTimestep:', index);
		this.cancel(); // in case it was busy with the rotten result :( This will remove unwanted layer

		index = this._checkIndex(index);
		// if (this.layer && index === this.currentIndex) return Promise.resolve(this.currentIndex); // wait first then check index!!!

		const layerId = this.props.id + index;
		const URI = this.props.wxprops.URITime.replace('{time}', this.props.wxprops.meta.times[index]);

		const layer = new MapboxLayer({
			type: WxTilesLayer,
			...this.props,
			id: layerId,
			data: URI,
			// onViewportLoad: resolve,
		});
		this.map.addLayer(layer, this.beforeLayerId);

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

		return Promise.resolve(index);
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

// export const createMapboxLayer = (
// 	map: Map,
// 	props: WxTilesLayerProps,
// 	beforeLayerId: string = map.getStyle().layers![map.getStyle().layers!.length - 1].id
// ) => {
// 	const firstLayer = map.getStyle().layers![0].id;
// 	let currentIndex = -1;
// 	let prevLayerId: string | undefined = undefined;

// 	let cancelPrevRequest = () => {};
// 	const renderCurrentTimestep = async () => {
// 		const { cancel, layerId, promise } = renderLayerByTimeIndex(currentIndex);
// 		cancelPrevRequest();
// 		cancelPrevRequest = cancel;
// 		await promise;
// 		map.moveLayer(layerId, beforeLayerId);
// 		prevLayerId && map.removeLayer(prevLayerId);
// 		prevLayerId = layerId;
// 		cancelPrevRequest = () => {};
// 	};

// 	const renderLayerByTimeIndex = (index: number) => {
// 		const uri = props.wxprops.URITime.replace('{time}', props.wxprops.meta.times[index]);
// 		const layerId = props.id + index;
// 		const promise = new Promise<void>((resolve, reject) => {
// 			const layer = new MapboxLayer({
// 				type: WxTilesLayer,
// 				...props,
// 				id: layerId,
// 				data: uri,
// 				onViewportLoad: resolve,
// 			});
// 			map.addLayer(layer, firstLayer);
// 		});
// 		return {
// 			layerId,
// 			promise,
// 			cancel: () => {
// 				map.removeLayer(layerId);
// 			},
// 		};
// 	};

// 	return {
// 		nextTimestep: async () => {
// 			currentIndex = (++currentIndex + props.wxprops.meta.times.length) % props.wxprops.meta.times.length;
// 			await renderCurrentTimestep();
// 			return currentIndex;
// 		},
// 		prevTimestep: async () => {
// 			currentIndex = (--currentIndex + props.wxprops.meta.times.length) % props.wxprops.meta.times.length;
// 			await renderCurrentTimestep();
// 			return currentIndex;
// 		},
// 		goToTimestep: async (index: number) => {
// 			if (index === currentIndex) {
// 				return;
// 			}
// 			currentIndex = (index + props.wxprops.meta.times.length) % props.wxprops.meta.times.length;
// 			await renderCurrentTimestep();
// 		},
// 		cancel: () => {
// 			cancelPrevRequest();
// 			cancelPrevRequest = () => {};
// 		},
// 		remove: () => {
// 			cancelPrevRequest();
// 			cancelPrevRequest = () => {};
// 			prevLayerId && map.removeLayer(prevLayerId);
// 			prevLayerId = undefined;
// 		},
// 	};
// };
