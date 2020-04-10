import 'regenerator-runtime/runtime';

class LinearGradient {
  constructor(parser) {
    this.parser = parser;
  }

  static css({
    r, g, b, a, start,
  }) {
    return `linear-gradient(rgba(${r}, ${g}, ${b}, ${a / 255}), rgba(${r}, ${g}, ${b}, ${a / 255})) ${start}px 0px / 1px 1px`;
  }

  async from(path) {
    const image = await this.parser.read(path);
    const gradients = [];

    image
      .pixels
      .forEach((row) => row.forEach((pixel, index) => {
        const start = index;
        gradients.push(LinearGradient.css({ ...pixel, start }));
      }));

    const style = `
<style>
  .r0 {
    width: ${image.width}px;
    height: ${image.height}px;
    background: ${gradients.join(', ')};
    background-repeat: no-repeat;
  }
</style>
`;

    const content = '<div class="r0"></div>';

    return `${style}${content}`;
  }
}

export default LinearGradient;
