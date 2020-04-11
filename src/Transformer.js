import 'regenerator-runtime/runtime';
import Parser from './Parser';

class Transformer {
  constructor(parser = new Parser()) {
    this.parser = parser;
  }

  static gradients(rows) {
    return rows.map((row) => ({
      ...row,
      gradients: row.chunks.map(
        (chunk) => Transformer.gradient({ ...chunk, height: row.height }),
      ),
    }));
  }

  static gradient({
    r, g, b, a, start, end, height,
  }) {
    return [
      `linear-gradient(rgba(${r}, ${g}, ${b}, ${a / 255}),`,
      `rgba(${r}, ${g}, ${b}, ${a / 255}))`,
      `${start}px 0px / ${end - start}px ${height}px`,
    ].join(' ');
  }

  static sameColor(a, b) {
    return a.r === b.r
      && a.g === b.g
      && a.b === b.b
      && a.a === b.a;
  }

  static compress(rows) {
    return rows.map((row) => ({
      ...row,
      chunks: ((chunks) => {
        const compressed = [];

        chunks.forEach((chunk) => {
          const prev = compressed[compressed.length - 1];
          if (prev) {
            if (Transformer.sameColor(prev, chunk)) {
              prev.end += 1;
            } else {
              chunk.start = prev.end;
              chunk.end = prev.end + 1;
              compressed.push(chunk);
            }
          } else {
            compressed.push(chunk);
          }
        });
        if (compressed.length === 1) {
          const [prev] = compressed;
          prev.end = chunks.length;
        }
        return compressed;
      })(row.chunks),
    }));
  }

  static compress2d(rows) {
    const compressed = [];

    rows.forEach((row) => {
      const prev = compressed[compressed.length - 1];
      const { chunks } = row;

      if (prev && JSON.stringify(prev.chunks) === JSON.stringify(chunks)) {
        prev.height += 1;
      } else {
        compressed.push({
          ...row,
          chunks,
        });
      }
    });

    return compressed;
  }

  static uniq(rows) {
    return rows.map((row, index) => {
      const match = rows
        .findIndex(
          (_row) => JSON.stringify(_row.chunks) === JSON.stringify(row.chunks)
            && _row.height === row.height,
        );

      if (match !== index) {
        row.reference = match;
      }

      return row;
    });
  }

  static initialize(rows) {
    return rows.map((row) => ({
      chunks: row.map((pixel) => ({
        ...pixel,
        start: 0,
        end: 1,
      })),
      gradients: [],
      height: 1,
      reference: null,
    }));
  }

  static html(width) {
    return (rows) => {
      const styles = [];
      const tags = [];

      rows
        .forEach(({ gradients, height, reference }, index) => {
          if (reference === null) {
            styles.push(`.r${index} {
  width: ${width}px;
  height: ${height}px;
  background: ${gradients.join(', ')};
  background-repeat: no-repeat;
}`);
            tags.push(`<div class="r${index}"></div>`);
          } else {
            tags.push(`<div class="r${reference}"></div>`);
          }
        });

      const html = `
<style>
${styles.join('\n')}
</style>
${tags.join('\n')}`;

      return html;
    };
  }

  async from(path) {
    const { width, pixels } = await this.parser.read(path);
    const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

    return pipe(
      Transformer.initialize,
      Transformer.compress,
      Transformer.compress2d,
      Transformer.uniq,
      Transformer.gradients,
      Transformer.html(width),
    )(pixels);
  }
}

export default Transformer;
