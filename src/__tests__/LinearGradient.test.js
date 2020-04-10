import LinearGradient from '../LinearGradient';
import 'regenerator-runtime/runtime';

describe(LinearGradient, () => {
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

      const gradient = new LinearGradient(parser);

      const html = await gradient.from('1.jpg');

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

      const gradient = new LinearGradient(parser);

      const html = await gradient.from('1.jpg');

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
  });
});
