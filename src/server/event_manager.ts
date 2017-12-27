import {mouseEvent, setElementValue} from './hack_driver/hack_driver';

export class EventManager {
	private static MOUSE_EVENT_TYPES:Set<string> = new Set<string>(['click', 'mousedown', 'mouseup', 'mousemove'])
	constructor(private chrome, private frameState) {
	}
	public onDeviceEvent(event, frame) {
		const {type} = event;
		if(EventManager.MOUSE_EVENT_TYPES.has(type)) {
			mouseEvent(this.chrome, event.id, type);
		} else if(type === 'input') {
			setElementValue(this.chrome, event.id, event.value);
		}
	}
}
