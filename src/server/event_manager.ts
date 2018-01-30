import {mouseEvent, setElementValue} from './hack_driver/hack_driver';
import {FrameState} from './state/frame_state';

export class EventManager {
	private static MOUSE_EVENT_TYPES:Set<string> = new Set<string>(['click', 'mousedown', 'mouseup', 'mousemove'])
	constructor(private chrome:CRI.Chrome, private frameState:FrameState) {
	}
	public onDeviceEvent(event, frame:FrameState):void {
		const {type} = event;
		if(EventManager.MOUSE_EVENT_TYPES.has(type)) {
			mouseEvent(this.chrome, event.id, type);
		} else if(type === 'input') {
			setElementValue(this.chrome, event.id, event.value);
		}
	}
}
