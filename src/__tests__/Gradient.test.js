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
      const image = await Jimp.read('./src/__tests__/examples/10.png');
      const { width, height } = image.bitmap || image._exif.imageSize;
      const gradients = [];
      const filtered = [];
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
          y: 1,
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
            y: 1,
          });
        }

        filtered.push(compressed.filter((pixel) => !(pixel.r === 255 && pixel.g === 255 && pixel.b === 255 && pixel.a === 255)));
      });

      const ultra = [];

      filtered.forEach((pixels) => {
        const prev = ultra[ultra.length - 1];

        const compare = (a, b) => {
          if (a.length === b.length) {
            return a.every((pixel, index) => {
              const bPixel = b[index];
              return pixel.r === bPixel.r && pixel.g === bPixel.g && pixel.b === bPixel.b && pixel.a === bPixel.a;
            });
          }
          return false;
        };

        if (prev && compare(prev, pixels)) {
          prev.forEach((pixel) => {
            pixel.y += 1;
          });
        } else {
          ultra.push(pixels);
        }
      });

      ultra.forEach((pixels) => {
        const gradient = `${pixels.map((pixel) => `linear-gradient(rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255}), rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})) ${pixel.start}px 0px / ${pixel.end - pixel.start}px ${pixel.y}px`).join(',')};`;
        gradients.push({
          css: gradient,
          y: pixels[0].y,
        });
      });

      gradients.filter((item, index) => {
        const foundIndex = gradients.findIndex((i) => item.css === i.css && i.y === item.y);
        if (index !== foundIndex) {
          console.log('duplicate');
        }
        return index === foundIndex;
      });

      const classes = gradients.map((gradient, index) => `.ultra${index} {width: ${width}px; height: ${gradient.y}px; background: ${gradient.css}; background-repeat: no-repeat}`);
      const style = `<style>${classes.join('\n')}</style>`;
      const divs = gradients.map((gradient, index) => `<div class="ultra${index}"></div>`);
      fs.writeFileSync('ultra.html', `${style}${divs.join('\n')}`);
    });
  });
});
