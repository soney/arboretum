function getImageData(canvasElement) {
	var ctx = canvasElement.getContext('2d');
	if(ctx) {
		return ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
	} else {
		var gl = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl');
		if(gl) {
			// gl.clearColor(.25, .5, .75, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
			gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			return {
				data: pixels,
				width: gl.drawingBufferWidth,
				height: gl.drawingBufferHeight
			};
		}
	}
}
