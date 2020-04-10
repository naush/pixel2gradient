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

    xit('creates gradient for 1 pixel', async () => {
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
        const gradient = `${pixels.map((pixel) => `linear-gradient(rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a / 255}),rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a / 255}))${pixel.start}px 0px / ${pixel.end - pixel.start}px ${pixel.y}px`).join(',')};`;

        const histograms = {
          r: 0, g: 0, b: 0, a: 0,
        };
        histograms.r = (pixels[0].y * pixels.map((pixel) => pixel.r).reduce((a, b) => a + b, 0)) / pixels.length;
        histograms.g = (pixels[0].y * pixels.map((pixel) => pixel.g).reduce((a, b) => a + b, 0)) / pixels.length;
        histograms.b = (pixels[0].y * pixels.map((pixel) => pixel.b).reduce((a, b) => a + b, 0)) / pixels.length;
        histograms.a = (pixels[0].y * pixels.map((pixel) => pixel.a).reduce((a, b) => a + b, 0)) / pixels.length;

        gradients.push({
          css: gradient,
          y: pixels[0].y,
          histograms,
        });
      });

      const diffH = (a, b) => (
        Math.abs(a.r - b.r)
          + Math.abs(a.g - b.g)
          + Math.abs(a.b - b.b)
          + Math.abs(a.a - b.a)
      );

      const duplicates = [];
      gradients.filter((item, index) => {
        const foundIndex = gradients.findIndex((i) => item.css === i.css || diffH(i.histograms, item.histograms) < 10);
        if (index !== foundIndex) {
          console.log([index, foundIndex]);
          duplicates.push(item);
          item.reference = foundIndex;
        }
        return index === foundIndex;
      });

      console.log('number of duplicates', duplicates.length);

      const classes = gradients.map((gradient, index) => {
        if (gradient.reference) {
          return null;
        }
        const time = index / 10;
        return `.r${index}{width:${width}px;height:${gradient.y}px;background:${gradient.css};background-repeat:no-repeat;animation: blinds ${time}s ease-in-out reverse forwards;}`;
      }).filter((gradient) => gradient);
      const animation = '@keyframes blinds { to { background-image: linear-gradient(90deg, #f90 100%, #444 0); } }';
      const style = `<style>${classes.join('\n')}${animation}</style>`;
      const divs = gradients.map((gradient, index) => {
        if (gradient.reference) {
          return `<div class="r${gradient.reference}"></div>`;
        }
        return `<div class="r${index}"></div>`;
      });
      fs.writeFileSync('dups.html', `${style}${divs.join('')}`);
    });
  });
});
