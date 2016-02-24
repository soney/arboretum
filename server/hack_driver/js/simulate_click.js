function simulateClick(element) {
	var event = document.createEvent("MouseEvents");
	event.initMouseEvent("click", true, true, window,
		0, 0, 0, 0, 0,
		false, false, false, false,
		0, null);
	element.dispatchEvent(event);
	return element;
}