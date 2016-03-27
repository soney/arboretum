function getImageData(canvasElement) {
	var ctx = canvasElement.getContext('2d');
	return ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
}