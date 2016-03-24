function getImageData(canvasElement) {
	var ctx = canvasElement.getContext('2d');
	return ctx.getImageData(canvasElement.width, canvasElement.height);
}