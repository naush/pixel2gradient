import Parser from '../Parser';
import 'regenerator-runtime/runtime';

describe(Parser, () => {
  let reader;
  let image;

  describe('#read', () => {
    beforeEach(() => {
      reader = jest.fn();
      reader.intToRGBA = jest.fn().mockImplementationOnce(() => {});
      image = jest.fn();
      image.getPixelColor = jest.fn().mockImplementationOnce(() => {});
    });

    it('delegates to reader', async () => {
      image.bitmap = {};
      reader.read = jest.fn().mockImplementationOnce(
        () => image,
      );

      const parser = new Parser(reader);

      await parser.read('test.jpg');

      expect(reader.read).toHaveBeenCalledWith('test.jpg');
    });

    it('retrieves width and height from jpg', async () => {
      image.bitmap = {
        width: 2,
        height: 1,
      };
      reader.read = () => image;

      const parser = new Parser(reader);

      const { width, height } = await parser.read('test.jpg');

      expect(width).toEqual(2);
      expect(height).toEqual(1);
    });

    it('retrieves width and height from png', async () => {
      image._exif = {
        imageSize: {
          width: 2,
          height: 1,
        },
      };
      reader.read = () => image;

      const parser = new Parser(reader);

      const { width, height } = await parser.read('test.png');

      expect(width).toEqual(2);
      expect(height).toEqual(1);
    });
  });
});
