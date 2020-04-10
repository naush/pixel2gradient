import Jimp from 'jimp';

class Parser {
  constructor(reader = Jimp) {
    this.reader = reader;
  }

  async read(path) {
    const image = await this.reader.read(path);
    const { width, height } = image.bitmap || image._exif.imageSize;
    const pixels = [...Array(height).keys()].map((y) => (
      [...Array(width).keys()].map((x) => {
        const color = image.getPixelColor(x, y);
        const rgba = this.reader.intToRGBA(color);
        return rgba;
      })
    ));

    return {
      width,
      height,
      pixels,
    };
  }
}

export default Parser;
