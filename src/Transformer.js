import 'regenerator-runtime/runtime';
import Parser from './Parser';

class Transformer {
  constructor(parser = new Parser()) {
    this.parser = parser;
  }

  static gradient({
    r, g, b, a, start, end,
  }) {
    return [
      `linear-gradient(rgba(${r}, ${g}, ${b}, ${a / 255}),`,
      `rgba(${r}, ${g}, ${b}, ${a / 255}))`,
      `${start}px 0px / ${end - start}px 1px`,
    ].join(' ');
  }

  static compress(pixels) {
    const sameColor = (a, b) => (
      a.r === b.r
        && a.g === b.g
        && a.b === b.b
        && a.a === b.a
    );

    const compressed = [];

    pixels.forEach((pixel, index) => {
      const prev = compressed[compressed.length - 1];
      if (prev) {
        if (sameColor(prev, pixel)) {
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

    pixels
      .forEach((row, y) => {
        const compressed = Transformer.compress(row);
        const gradients = compressed.map((pixel) => (
          Transformer.gradient({ ...pixel })
        ));
        styles.push(`.r${y} {
  width: ${width}px;
  height: 1px;
  background: ${gradients.join(', ')};
  background-repeat: no-repeat;
}`);
        tags.push(`<div class="r${y}"></div>`);
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
