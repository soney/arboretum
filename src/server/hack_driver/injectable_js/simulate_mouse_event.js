function simulateMouseEvent(element, eventType, eventData) {
	var event = document.createEvent("MouseEvents");
	event.initMouseEvent(eventType, true, true, window,
		0, 0, 0, 0, 0,
		false, false, false, false,
		0, null);
	element.dispatchEvent(event);
	return element;
}
