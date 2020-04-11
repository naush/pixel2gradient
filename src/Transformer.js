import 'regenerator-runtime/runtime';
import Parser from './Parser';

class Transformer {
  constructor(parser = new Parser()) {
    this.parser = parser;
  }

  static gradients(row, y) {
    return row.map((pixels) => Transformer.gradient({ ...pixels, y }));
  }

  static gradient({
    r, g, b, a, start, end, y,
  }) {
    return [
      `linear-gradient(rgba(${r}, ${g}, ${b}, ${a / 255}),`,
      `rgba(${r}, ${g}, ${b}, ${a / 255}))`,
      `${start}px 0px / ${end - start}px ${y}px`,
    ].join(' ');
  }

  static sameColor(a, b) {
    return a.r === b.r
      && a.g === b.g
      && a.b === b.b
      && a.a === b.a;
  }

  static compress(pixels) {
    const compressed = [];

    pixels.forEach((pixel) => {
      const prev = compressed[compressed.length - 1];
      if (prev) {
        if (Transformer.sameColor(prev, pixel)) {
          prev.end = (prev.end || 0) + 1;
        } else {
          pixel.start = prev.end || 0;
          pixel.end = (prev.end || 0) + 1;
          compressed.push(pixel);
        }
      } else {
        pixel.start = pixel.start || 0;
        pixel.end = pixel.end || 1;
        compressed.push(pixel);
      }
    });
    if (compressed.length === 1) {
      const [prev] = compressed;
      prev.end = pixels.length;
    }
    return compressed;
  }

  async from(path) {
    const { width, pixels } = await this.parser.read(path);
    const styles = [];
    const tags = [];

    const rows = pixels
      .map((row) => ({
        pixels: Transformer.compress(row),
        y: 1,
      }));

    const uniques = [];
    rows.forEach((row) => {
      const { y } = row;
      const prev = uniques[uniques.length - 1];
      if (prev && JSON.stringify(prev.pixels) === JSON.stringify(row.pixels)) {
        prev.y += 1;
      } else {
        uniques.push({
          pixels: row.pixels,
          y,
        });
      }
    });

    uniques
      .map((row) => ({ gradients: Transformer.gradients(row.pixels, row.y), y: row.y }))
      .forEach(({ gradients, y }, index, _rows) => {
        const i = _rows.findIndex((row) => gradients.join() === row.gradients.join());

        if (i !== index) {
          tags.push(`<div class="r${i}"></div>`);
        } else {
          styles.push(`.r${index} {
  width: ${width}px;
  height: ${y}px;
  background: ${gradients.join(', ')};
  background-repeat: no-repeat;
}`);
          tags.push(`<div class="r${index}"></div>`);
        }
      });

    const html = `
<style>
${styles.join('\n')}
</style>
${tags.join('\n')}`;

    return html;
  }
}

export default Transformer;
