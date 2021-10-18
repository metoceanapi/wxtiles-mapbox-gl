import { MapboxLayer } from '@deck.gl/mapbox';
import { Map } from 'mapbox-gl';

import { WxTilesLayerProps, WxTilesLayer, WXLOG } from '@metoceanapi/wxtiles-deckgl';
import { MapboxLayerProps } from '@deck.gl/mapbox/mapbox-layer';

export class WxTilesLayerManager {
	props: WxTilesLayerProps;
	currentIndex: number = 0;
	layer?: MapboxLayer<string>;
	beforeLayerId?: string = undefined;

	private URIs: string[];
	private map: Map;
	private cancelNewLayerPromise?: () => void;

	constructor({ map, props, beforeLayerId }: { map: Map; props: WxTilesLayerProps; beforeLayerId: string }) {
		this.map = map;
		this.props = props;
		this.beforeLayerId = beforeLayerId;
		this.URIs = props.wxprops.meta.times.map((time) => props.wxprops.URITime.replace('{time}', time));
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
		// should be async? - ибо нахер!
		if (this.cancelNewLayerPromise) {
			WXLOG('cancel');
			this.cancelNewLayerPromise();
		}
	}

	remove(): void {
		WXLOG('remove:', this.layer?.id);
		this.cancel();
		if (this.layer) this.map.removeLayer(this.layer.id);
		this.layer = undefined;
	}

	goToTimestep(index: number): Promise<number> {
		WXLOG('goToTimestep:', index);
		this.cancel(); // in case it was busy with the rotten result :( This will remove unwanted layer

		index = this._checkIndex(index);
		if (this.layer && index === this.currentIndex) return Promise.resolve(this.currentIndex); // wait first then check index!!!

		const props: any = {
			...this.props,
			id: this.props.id + index,
			type: WxTilesLayer,
			renderingMode: '2d',
			data: this.URIs[index],
		};

		if (!this.layer) {
			this.layer = new MapboxLayer(props);
			this.map.addLayer(this.layer, this.beforeLayerId);
			this.currentIndex = index;
			WXLOG('created:', index);
			return Promise.resolve(index);
		}
		// else {
		// 	this.layer.setProps(props);
		// }
		// this.currentIndex = index;
		// return Promise.resolve(index);

		const promise = new Promise<number>((resolve): void => {
			WXLOG('promise:', index, 'started');
			const newInvisibleLayer = new MapboxLayer<string>({
				...props,
				visible: false,
				onViewportLoad: (): void => {
					setTimeout(() => {
						WXLOG('promise:onViewportLoad:', index);
						this.cancelNewLayerPromise = undefined;
						newInvisibleLayer.setProps({ visible: true, onViewportLoad: this.props.onViewportLoad });
						this.layer!.setProps({ visible: false });
						const oldLayerId = this.layer!.id;
						setTimeout(() => this.map.removeLayer(oldLayerId), 100);
						this.layer = newInvisibleLayer;
						this.currentIndex = index;
						resolve(index);
					});
				},
			});

			this.map.addLayer(newInvisibleLayer, this.beforeLayerId);

			this.cancelNewLayerPromise = () => {
				WXLOG('promise:cancelNewLayerPromise:', index);
				this.map.removeLayer(newInvisibleLayer.id);
				this.cancelNewLayerPromise = undefined;
				resolve(this.currentIndex);
			};

			WXLOG('promise:', index, 'finished');
		});

		WXLOG('newLayerByTimeIndexPromise:', index, 'finished');

		return promise;
	}

	private _checkIndex(index: number): number {
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
