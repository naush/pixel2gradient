import fs from 'fs';
import Transformer from '../Transformer';
import 'regenerator-runtime/runtime';

describe(Transformer, () => {
  describe('example', () => {
    it('makes an example', async () => {
      const transformer = new Transformer();
      const result = await transformer.from('./examples/nine.jpg');
      fs.writeFileSync('nine.html', result);
    });

    xit('rgb to hsl', () => {
      const a = { r: 10, g: 10, b: 10 };
      const b = { r: 0, g: 0, b: 0 };

      const interpolate = (start, end, stepNumber, lastStepNumber) => {
        const value = ((end - start) * stepNumber) / lastStepNumber + start;
        return value;
      };

      [...Array(11).keys()].forEach((step) => {
        console.log('(r, g, b)',
          [
            interpolate(a.r, b.r, step, 10),
            interpolate(a.g, b.g, step, 10),
            interpolate(a.b, b.b, step, 10),
          ]);
      });
    });
  });

  describe('#from', () => {
    it('converts a pixel', async () => {
      const parser = jest.fn();
      const image = {
        width: 1,
        height: 1,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
    });

    it('converts two pixels on a line', async () => {
      const parser = jest.fn();
      const image = {
        width: 2,
        height: 1,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 0,
              g: 255,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 2px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 0, 0, 1), rgba(0, 255, 0, 1)) 0px 0px / 2px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
    });

    it('converts three pixels on a line', async () => {
      const parser = jest.fn();
      const image = {
        width: 3,
        height: 1,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 0,
              g: 0,
              b: 255,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 3px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 2px 1px, linear-gradient(rgba(0, 0, 255, 1), rgba(0, 0, 255, 1)) 2px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
    });

    it('converts one pixel per line', async () => {
      const parser = jest.fn();
      const image = {
        width: 1,
        height: 2,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
          [
            {
              r: 0,
              g: 255,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
.g1 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(0, 255, 0, 1), rgba(0, 255, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>
<div class="g1"></div>`);
    });

    it('combines adjacent pixels on the same line with the same color', async () => {
      const parser = jest.fn();
      const image = {
        width: 2,
        height: 1,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 2px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 3px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
    });

    it('reuses the same style for lines with the same color sequence', async () => {
      const parser = jest.fn();
      const image = {
        width: 2,
        height: 2,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
          [
            {
              r: 0,
              g: 0,
              b: 255,
              a: 255,
            },
            {
              r: 0,
              g: 0,
              b: 255,
              a: 255,
            },
          ],
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 2px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 2px 1px;
  background-repeat: no-repeat;
}
.g1 {
  width: 2px;
  height: 1px;
  background: linear-gradient(rgba(0, 0, 255, 1), rgba(0, 0, 255, 1)) 0px 0px / 2px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>
<div class="g1"></div>
<div class="g0"></div>`);
    });

    it('joins adjacent lines with the same color sequence', async () => {
      const parser = jest.fn();
      const image = {
        width: 2,
        height: 2,
        pixels: [
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
          [
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
            {
              r: 255,
              g: 0,
              b: 0,
              a: 255,
            },
          ],
        ],
      };

      parser.read = () => Promise.resolve(image);

      const transformer = new Transformer(parser);

      const html = await transformer.from('test.jpg');

      expect(html).toEqual(`
<style>
.g0 {
  width: 2px;
  height: 2px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 2px 2px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
    });

    describe('linear gradients', () => {
      it('handles r decrement', async () => {
        const parser = jest.fn();
        const image = {
          width: 3,
          height: 1,
          pixels: [
            [
              {
                r: 255,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 254,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 253,
                g: 0,
                b: 0,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 3px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 0, 0, 1), rgba(253, 0, 0, 1)) 0px 0px / 3px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });

      it('handles r increment', async () => {
        const parser = jest.fn();
        const image = {
          width: 3,
          height: 1,
          pixels: [
            [
              {
                r: 253,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 254,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 255,
                g: 0,
                b: 0,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 3px;
  height: 1px;
  background: linear-gradient(90deg, rgba(253, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 3px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });

      it('handles any channel with increment and decrement', async () => {
        const parser = jest.fn();
        const image = {
          width: 3,
          height: 1,
          pixels: [
            [
              {
                r: 0,
                g: 255,
                b: 0,
                a: 255,
              },
              {
                r: 0,
                g: 254,
                b: 0,
                a: 255,
              },
              {
                r: 0,
                g: 253,
                b: 0,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 3px;
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 255, 0, 1), rgba(0, 253, 0, 1)) 0px 0px / 3px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });

      it('consecutive gradients', async () => {
        const parser = jest.fn();
        const image = {
          width: 5,
          height: 1,
          pixels: [
            [
              {
                r: 255,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 254,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 253,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 99,
                g: 0,
                b: 0,
                a: 255,
              },
              {
                r: 100,
                g: 0,
                b: 0,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 5px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 0, 0, 1), rgba(253, 0, 0, 1)) 0px 0px / 3px 1px, linear-gradient(90deg, rgba(99, 0, 0, 1), rgba(100, 0, 0, 1)) 3px 0px / 2px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });

      it('alternates gradient and non-gradient chunks', async () => {
        const parser = jest.fn();
        const image = {
          width: 3,
          height: 1,
          pixels: [
            [
              {
                r: 230,
                g: 5,
                b: 37,
                a: 255,
              },
              {
                r: 230,
                g: 5,
                b: 37,
                a: 255,
              },
              {
                r: 229,
                g: 4,
                b: 36,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 3px;
  height: 1px;
  background: linear-gradient(rgba(230, 5, 37, 1), rgba(230, 5, 37, 1)) 0px 0px / 2px 1px, linear-gradient(rgba(229, 4, 36, 1), rgba(229, 4, 36, 1)) 2px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });

      it('handles multiple channels', async () => {
        const parser = jest.fn();
        const image = {
          width: 5,
          height: 1,
          pixels: [
            [
              {
                r: 5,
                g: 5,
                b: 5,
                a: 255,
              },
              {
                r: 4,
                g: 4,
                b: 4,
                a: 255,
              },
              {
                r: 3,
                g: 3,
                b: 3,
                a: 255,
              },
              {
                r: 2,
                g: 2,
                b: 2,
                a: 255,
              },
              {
                r: 1,
                g: 1,
                b: 1,
                a: 255,
              },
            ],
          ],
        };

        parser.read = () => Promise.resolve(image);

        const transformer = new Transformer(parser);

        const html = await transformer.from('test.jpg');

        expect(html).toEqual(`
<style>
.g0 {
  width: 5px;
  height: 1px;
  background: linear-gradient(90deg, rgba(5, 5, 5, 1), rgba(1, 1, 1, 1)) 0px 0px / 5px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="g0"></div>`);
      });
    });
  });
});
