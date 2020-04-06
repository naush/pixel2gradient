import Jimp from 'jimp';
import 'regenerator-runtime/runtime';
import Gradient from '../Gradient';

describe(Gradient, () => {
  describe('toCss', () => {
    xit('creates gradient for 1 pixel', async () => {
      const file = await Jimp.read('./src/__tests__/examples/9.jpg');
      file.resize(256, 256).write('256.jpg');
    });

    it('creates gradient for 1 pixel', async () => {
      const image = await Jimp.read('./src/__tests__/examples/9.jpg');
      const { width, height } = image._exif.imageSize;
      [...Array(width).keys()].forEach((x) => {
        [...Array(1).keys()].forEach((y) => {
          const color = image.getPixelColor(x, y);
          const rgba = Jimp.intToRGBA(color);
          console.log(rgba);
        });
      });
    });
  });
});
