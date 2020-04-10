import 'regenerator-runtime/runtime';
import Parser from './Parser';

class Transformer {
  constructor(parser = new Parser()) {
    this.parser = parser;
  }

  static gradient({
    r, g, b, a, start,
  }) {
    return `linear-gradient(rgba(${r}, ${g}, ${b}, ${a / 255}), rgba(${r}, ${g}, ${b}, ${a / 255})) ${start}px 0px / 1px 1px`;
  }

  async from(path) {
    const { width, pixels } = await this.parser.read(path);
    const styles = [];
    const tags = [];

    pixels
      .forEach((row, y) => {
        const gradients = [];
        row.forEach((pixel, x) => {
          const start = x;
          gradients.push(Transformer.gradient({ ...pixel, start }));
        });
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
