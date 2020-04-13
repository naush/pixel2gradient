import 'regenerator-runtime/runtime';
import Parser from './Parser';

class Transformer {
  constructor(parser = new Parser()) {
    this.parser = parser;
  }

  static css(rows) {
    return rows.map((row) => ({
      ...row,
      css: row.chunks.map(
        (chunk) => Transformer.gradient({ ...chunk, height: row.height }),
      ),
    }));
  }

  static gradient({
    r0,
    r1,
    g0,
    g1,
    b0,
    b1,
    a0,
    a1,
    start,
    end,
    height,
  }) {
    if (r0 !== r1 || g0 !== g1 || b0 !== b1) {
      return [
        `linear-gradient(90deg, rgba(${r0}, ${g0}, ${b0}, ${a0 / 255}),`,
        `rgba(${r1}, ${g1}, ${b1}, ${a1 / 255}))`,
        `${start}px 0px / ${end - start}px ${height}px`,
      ].join(' ');
    }
    return [
      `linear-gradient(rgba(${r0}, ${g0}, ${b0}, ${a0 / 255}),`,
      `rgba(${r1}, ${g1}, ${b1}, ${a1 / 255}))`,
      `${start}px 0px / ${end - start}px ${height}px`,
    ].join(' ');
  }

  static compareColors(a, b) {
    return a.r0 === b.r0
      && a.r1 === b.r1
      && a.g0 === b.g0
      && a.g1 === b.g1
      && a.b0 === b.b0
      && a.b1 === b.b1
      && a.a0 === b.a0
      && a.a1 === b.a1;
  }

  static compress(rows) {
    return rows.map((row) => ({
      ...row,
      chunks: ((chunks) => {
        const compressed = [];

        chunks.forEach((chunk) => {
          const prev = compressed[compressed.length - 1];
          if (prev) {
            if (Transformer.compareColors(prev, chunk)) {
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

      if (prev && Transformer.compareRows(prev, row)) {
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

  static compareRows(a, b) {
    return JSON.stringify(a.chunks) === JSON.stringify(b.chunks);
  }

  static compareHistograms(a, b, margin = 0) {
    const buildHistograms = (chunks, height) => {
      const histograms = {
        r: { '0-127': 0, '128-255': 0 },
        g: { '0-127': 0, '128-255': 0 },
        b: { '0-127': 0, '128-255': 0 },
      };

      chunks.forEach((chunk) => {
        const count = (chunk.end - chunk.start) * height;
        histograms.r[chunk.r0 < 128 ? '0-127' : '128-255'] += count;
        histograms.g[chunk.g0 < 128 ? '0-127' : '128-255'] += count;
        histograms.b[chunk.b0 < 128 ? '0-127' : '128-255'] += count;
      });

      return histograms;
    };

    const compareHistograms = (left, right, margin) => (
      Math.abs(left.r['0-127'] - right.r['0-127']) <= margin
        && Math.abs(left.g['0-127'] - right.g['0-127']) <= margin
        && Math.abs(left.b['0-127'] - right.b['0-127']) <= margin
        && Math.abs(left.r['128-255'] - right.r['128-255']) <= margin
        && Math.abs(left.g['128-255'] - right.g['128-255']) <= margin
        && Math.abs(left.b['128-255'] - right.b['128-255']) <= margin
    );

    return compareHistograms(
      buildHistograms(a.chunks, a.height),
      buildHistograms(b.chunks, b.height),
      margin,
    );
  }

  static uniq(rows) {
    return rows.map((row, index) => {
      const match = rows
        .findIndex(
          (_row) => Transformer.compareRows(_row, row)
            && _row.height === row.height,
        );

      if (match >= 0 && match !== index) {
        row.reference = match;
      }

      return row;
    });
  }

  static initialize(rows) {
    return rows.map((row) => ({
      chunks: row.map((pixel) => ({
        r0: pixel.r,
        r1: pixel.r,
        g0: pixel.g,
        g1: pixel.g,
        b0: pixel.b,
        b1: pixel.b,
        a0: pixel.a,
        a1: pixel.a,
        start: 0,
        end: 1,
      })),
      css: [],
      height: 1,
      reference: null,
    }));
  }

  static html(width) {
    return (rows) => {
      const styles = [];
      const tags = [];

      rows
        .forEach(({ css, height, reference }, index) => {
          if (reference === null) {
            styles.push(`.g${index} {
  width: ${width}px;
  height: ${height}px;
  background: ${css.join(', ')};
  background-repeat: no-repeat;
}`);
            tags.push(`<div class="g${index}"></div>`);
          } else {
            tags.push(`<div class="g${reference}"></div>`);
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

  static linear(rows) {
    return rows.map((row) => ({
      ...row,
      chunks: ((chunks) => {
        const compressed = [];

        chunks.forEach((chunk) => {
          const prev = compressed[compressed.length - 1];

          if (prev) {
            if (prev.end - prev.start === 1
              && chunk.end - chunk.start === 1) {
              prev.r1 = chunk.r0;
              prev.end = chunk.end;
              prev.g1 = chunk.g0;
              prev.end = chunk.end;
              prev.b1 = chunk.b0;
              prev.end = chunk.end;
            } else {
              const steps = prev.end - prev.start - 1;

              if (chunk.r0 - prev.r1 === (prev.r1 - prev.r0) / steps
                && chunk.g0 - prev.g1 === (prev.g1 - prev.g0) / steps
                && chunk.b0 - prev.b1 === (prev.b1 - prev.b0) / steps
              ) {
                prev.r1 = chunk.r0;
                prev.end = chunk.end;
                prev.g1 = chunk.g0;
                prev.end = chunk.end;
                prev.b1 = chunk.b0;
                prev.end = chunk.end;
              } else {
                compressed.push(chunk);
              }
            }
          } else {
            compressed.push(chunk);
          }
        });

        return compressed;
      })(row.chunks),
    }));
  }

  async from(path) {
    const { width, pixels } = await this.parser.read(path);
    const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

    return pipe(
      Transformer.initialize,
      Transformer.compress,
      Transformer.compress2d,
      Transformer.uniq,
      Transformer.linear,
      Transformer.css,
      Transformer.html(width),
    )(pixels);
  }
}

export default Transformer;
