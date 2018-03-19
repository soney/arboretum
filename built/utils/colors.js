"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RGB {
    constructor(r = 0, g = 0, b = 0, alpha = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.alpha = alpha;
        this.value = 0;
        this.setRed(r).setGreen(g).setBlue(b);
        this.updateValue();
    }
    getHexPart(v) {
        let h = v.toString(16);
        return (h.length > 1) ? h : "0" + h;
    }
    updateValue() {
        this.value = (this.getRed() + this.getGreen() + this.getBlue());
        return this;
    }
    getValue() {
        return this.value;
    }
    toHex() {
        let hexString = (this.getAlpha() < 1) ? this.toHexAlpha().toString() : "#" + this.getHexPart(this.getRed()) + this.getHexPart(this.getGreen()) + this.getHexPart(this.getBlue());
        return new HEX(hexString);
    }
    toHexAlpha(light = true) {
        let tmpRgb = new RGB(this.getRed(), this.getGreen(), this.getBlue());
        if (this.getAlpha() < 1) {
            let tmp = (1 - this.getAlpha());
            tmpRgb.setRed(tmpRgb.getRed() * tmp);
            tmpRgb.setGreen(tmpRgb.getGreen() * tmp);
            tmpRgb.setBlue(tmpRgb.getBlue() * tmp);
        }
        let adjustValue = (this.getAlpha() < 1) ? Math.floor(255 * this.getAlpha()) : 0;
        return (light) ? tmpRgb.lighter(adjustValue).toHex() : tmpRgb.darker(adjustValue).toHex();
    }
    setRed(value) {
        this.r = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
        return this.updateValue();
    }
    getRed() {
        return this.r;
    }
    setGreen(value) {
        this.g = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
        return this.updateValue();
    }
    getGreen() {
        return this.g;
    }
    setBlue(value) {
        this.b = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
        return this.updateValue();
    }
    getBlue() {
        return this.b;
    }
    withAlpha(a) {
        if (a < 0 || a > 1) {
            a = 1;
        }
        return new RGB(this.r, this.g, this.b, a);
    }
    ;
    getAlpha() {
        return this.alpha;
    }
    lighter(by) {
        return new RGB(this.getRed() + by, this.getGreen() + by, this.getBlue() + by);
    }
    darker(by) {
        return new RGB(this.getRed() - by, this.getGreen() - by, this.getBlue() - by);
    }
    toString() {
        return (this.alpha < 1) ? 'rgba(' + this.getRed() + ',' + this.getGreen() + ',' + this.getBlue() + ',' + this.getAlpha() + ')' : 'rgb(' + this.getRed() + ',' + this.getGreen() + ',' + this.getBlue() + ')';
    }
}
exports.RGB = RGB;
class HEX {
    constructor(hex) {
        this.hex = "#000000";
        this.hex = (hex.toString().length == 6) ? "#" + hex : (hex.toString().length == 7) ? hex : null;
    }
    toRGB() {
        let hexString = this.hex.substr(1).toString();
        return new RGB(parseInt(hexString.substr(0, 2), 16), parseInt(hexString.substr(2, 2), 16), parseInt(hexString.substr(4, 2), 16));
    }
    toString() {
        return this.hex;
    }
}
exports.HEX = HEX;
class Color {
    constructor(color) {
        if (color instanceof HEX) {
            this.hex = color;
            this.rgb = color.toRGB();
        }
        else if (color instanceof RGB) {
            this.rgb = color;
            this.hex = color.toHex();
        }
    }
    lighter(by) {
        return new Color(this.rgb.lighter(by));
    }
    darker(by) {
        return new Color(this.rgb.darker(by));
    }
    toString(rgb = true) {
        return (rgb) ? this.rgb.toString() : this.hex.toString();
    }
    withAlpha(a) {
        return new Color(this.rgb.withAlpha(a));
    }
}
exports.Color = Color;
