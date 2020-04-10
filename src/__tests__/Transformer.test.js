import fs from 'fs';
import Transformer from '../Transformer';
import 'regenerator-runtime/runtime';

describe(Transformer, () => {
  describe('example', () => {
    it('makes an example', async () => {
      const transformer = new Transformer();
      const result = await transformer.from('./examples/9.jpg');
      fs.writeFileSync('example.html', result);
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
.r0 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="r0"></div>`);
    });

    it('converts multiple pixels on a line', async () => {
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
.r0 {
  width: 2px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 1px 1px, linear-gradient(rgba(0, 255, 0, 1), rgba(0, 255, 0, 1)) 1px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="r0"></div>`);
    });

    it('converts pixels on multiple lines', async () => {
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
.r0 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(255, 0, 0, 1), rgba(255, 0, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
.r1 {
  width: 1px;
  height: 1px;
  background: linear-gradient(rgba(0, 255, 0, 1), rgba(0, 255, 0, 1)) 0px 0px / 1px 1px;
  background-repeat: no-repeat;
}
</style>
<div class="r0"></div>
<div class="r1"></div>`);
    });
  });
});
