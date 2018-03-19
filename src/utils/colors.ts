export class RGB {

  private value : number = 0;

  constructor(private r:number = 0, private g : number = 0, private b : number = 0, private alpha:number=1) {
    this.setRed(r).setGreen(g).setBlue(b);
    this.updateValue();
 }

 private getHexPart(v : number) : string {
   let h : string = v.toString(16);
   return (h.length > 1) ? h : "0"+h;
 }

 public updateValue(): RGB {
   this.value = (this.getRed() + this.getGreen() + this.getBlue());
    return this;
 }

 public getValue() : number {
   return this.value;
 }

  public toHex() : HEX {
    let hexString : string = (this.getAlpha() < 1) ?  this.toHexAlpha().toString() : "#"+this.getHexPart(this.getRed())+this.getHexPart(this.getGreen())+this.getHexPart(this.getBlue());
    return new HEX(hexString);
  }

  public toHexAlpha(light : boolean = true) : HEX {
    let tmpRgb : RGB = new RGB(this.getRed(), this.getGreen(), this.getBlue());
    if(this.getAlpha() < 1) {
      let tmp : number = (1 - this.getAlpha());
      tmpRgb.setRed(tmpRgb.getRed() * tmp);
      tmpRgb.setGreen(tmpRgb.getGreen() * tmp);
      tmpRgb.setBlue(tmpRgb.getBlue() * tmp);
    }
    let adjustValue : number = (this.getAlpha() < 1) ? Math.floor(255 * this.getAlpha()) : 0;
    return (light) ? tmpRgb.lighter(adjustValue).toHex() : tmpRgb.darker(adjustValue).toHex();
  }

  public setRed(value : number) : RGB {
    this.r = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
    return this.updateValue();
  }

  public getRed() : number {
    return this.r;
  }

  public setGreen(value : number) : RGB {
    this.g = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
    return this.updateValue();
  }

  public getGreen() : number {
    return this.g;
  }

  public setBlue(value : number) : RGB {
    this.b = (value > 255) ? 255 : ((value < 0) ? 0 : Math.floor(value));
    return this.updateValue();
  }

  public getBlue() : number {
    return this.b;
  }

  public withAlpha(a : number) : RGB {
    if(a<0 || a > 1) { a = 1; }
    return new RGB(this.r, this.g, this.b, a);
  };

  public getAlpha() : number {
    return this.alpha;
  }

  public lighter(by : number) : RGB {
    return new RGB(this.getRed() + by, this.getGreen() + by, this.getBlue() + by);
  }

  public darker(by : number) : RGB {
    return new RGB(this.getRed() - by, this.getGreen() - by, this.getBlue() - by);
  }

  public toString() : string {
    return (this.alpha < 1) ? 'rgba('+this.getRed()+','+this.getGreen()+','+this.getBlue()+','+this.getAlpha()+')' : 'rgb('+this.getRed()+','+this.getGreen()+','+this.getBlue()+')';
  }

}

export class HEX {

  private hex : string = "#000000";

  constructor(hex : string) {
    this.hex = (hex.toString().length == 6) ? "#"+hex : (hex.toString().length == 7) ? hex : null;
  }

  public toRGB() : RGB {
      let hexString : string = this.hex.substr(1).toString();
      return new RGB(parseInt(hexString.substr(0,2),16),parseInt(hexString.substr(2,2),16),parseInt(hexString.substr(4,2),16));
   }

   public toString() : string {
     return this.hex;
   }

}

export class Color {

  private hex : HEX;
  private rgb : RGB;

  constructor(color : (HEX | RGB)) {
    if(color instanceof HEX) {
      this.hex = color;
      this.rgb = color.toRGB();
    } else if(color instanceof RGB) {
      this.rgb = color;
      this.hex = color.toHex();
    }

  }

  public lighter(by : number) : Color {
    return new Color(this.rgb.lighter(by));
  }

  public darker(by : number) : Color {
    return new Color(this.rgb.darker(by));
  }

  public toString(rgb : boolean = true) : string {
    return (rgb) ? this.rgb.toString() : this.hex.toString();
  }

  public withAlpha(a : number) : Color {
    return new Color(this.rgb.withAlpha(a));
  }

}
