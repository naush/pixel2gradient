import Jimp from 'jimp';
import 'regenerator-runtime/runtime';
import fs from 'fs';
import Gradient from '../Gradient';

describe(Gradient, () => {
  describe('toCss', () => {
    xit('creates gradient for 1 pixel', async () => {
      const file = await Jimp.read('./src/__tests__/examples/9.jpg');
      file.resize(256, 256).write('256.jpg');
    });

    it('creates gradient for 1 pixel', async () => {
      // const image = await Jimp.read('./src/__tests__/examples/9.jpg');
      const image = await Jimp.read('./src/__tests__/examples/10.png');
      const { width, height } = image.bitmap || image._exif.imageSize;
      const gradients = [];
      [...Array(height).keys()].forEach((y) => {
        const colors = [];
        [...Array(width).keys()].forEach((x) => {
          const color = image.getPixelColor(x, y);
          const rgba = Jimp.intToRGBA(color);
          colors.push(rgba);
        });
        const pixels = colors.map((rgba) => ({
          r: rgba.r,
          g: rgba.g,
          b: rgba.b,
          a: rgba.a,
          start: 0,
          end: 1,
        }));

        const compressed = [];
        let prevPixel = null;

        pixels.forEach((pixel) => {
          prevPixel = compressed[compressed.length - 1];

          if (prevPixel) {
            if (pixel.r === prevPixel.r
              && pixel.g === prevPixel.g
              && pixel.b === prevPixel.b
              && pixel.a === prevPixel.a
            ) {
              prevPixel.end += 1;
            } else {
              pixel.start = prevPixel.end;
              pixel.end = prevPixel.end + 1;
              compressed.push(pixel);
            }
          } else {
            compressed.push(pixel);
          }
        });

        if (compressed.length === 1) {
          compressed.push({
            r: prevPixel.r,
            g: prevPixel.g,
            b: prevPixel.b,
            a: prevPixel.a,
            start: 0,
            end: width,
          });
        }

        const gradient = `${compressed.map((pixel) => `linear-gradient(rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255}), rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})) ${pixel.start}px 0px / ${pixel.end - pixel.start}px 1px`).join(',')};`;

        gradients.push(gradient);
      });
      const divs = gradients.map((gradient) => `<div style="width: ${width}px; height: 1px; background: ${gradient}; background-repeat: no-repeat"></div>`);
      fs.writeFileSync('test2.html', divs.join('\n'));
    });
  });
});
