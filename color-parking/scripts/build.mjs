/**
 * Build script: esbuild (TypeScript + React) + Tailwind CSS v4 + PWA files.
 *
 *   node scripts/build.mjs          production build into dist/
 *   node scripts/build.mjs --dev    rebuild on change + serve on http://localhost:5173
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { compile } from 'tailwindcss';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const dev = process.argv.includes('--dev');

// --- Tailwind ---------------------------------------------------------------
const twRoot = dirname(fileURLToPath(import.meta.resolve('tailwindcss/package.json')));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Every token in the source that could be a class name; Tailwind ignores the rest. */
function candidates() {
  const set = new Set();
  for (const file of walk(src).filter((f) => /\.(tsx?|html)$/.test(f))) {
    for (const token of readFileSync(file, 'utf8').split(/[\s"'`{}();,<>]+/)) {
      if (token && token.length < 80) set.add(token);
    }
  }
  return [...set];
}

async function buildCss(file) {
  const compiler = await compile(readFileSync(file, 'utf8'), {
    base: dirname(file),
    async loadStylesheet(id) {
      const name = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '');
      const path = join(twRoot, name.endsWith('.css') ? name : `${name}.css`);
      return { path, base: twRoot, content: readFileSync(path, 'utf8') };
    },
  });
  return compiler.build(candidates());
}

const tailwindPlugin = {
  name: 'tailwind',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => ({
      contents: await buildCss(args.path),
      loader: 'css',
      watchFiles: walk(src),
    }));
  },
};

// --- HTML + service worker --------------------------------------------------
function writeHtml(js, css) {
  const html = readFileSync(join(root, 'index.html'), 'utf8')
    .replace('<!--styles-->', css.map((f) => `<link rel="stylesheet" href="/${f}" />`).join('\n    '))
    .replace('<!--scripts-->', js.map((f) => `<script type="module" src="/${f}"></script>`).join('\n    '));
  writeFileSync(join(dist, 'index.html'), html);
}

function writeServiceWorker() {
  const files = walk(dist)
    .map((f) => '/' + relative(dist, f).split('\\').join('/'))
    .filter((f) => f !== '/sw.js' && !f.endsWith('.map'))
    .sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
  const version = hash.digest('hex').slice(0, 12);
  const precache = ['/', ...files];
  const sw = readFileSync(join(root, 'scripts', 'sw-template.js'), 'utf8')
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
  writeFileSync(join(dist, 'sw.js'), sw);
  return { version, count: precache.length };
}

// --- build ------------------------------------------------------------------
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), dist, { recursive: true });

const options = {
  entryPoints: [join(src, 'main.tsx')],
  bundle: true,
  outdir: join(dist, 'assets'),
  entryNames: dev ? '[name]' : '[name]-[hash]',
  format: 'esm',
  target: ['safari15', 'chrome100', 'firefox100'],
  jsx: 'automatic',
  minify: !dev,
  sourcemap: dev,
  metafile: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
    __DEV__: JSON.stringify(dev),
  },
  nodePaths: process.env.NODE_PATH ? process.env.NODE_PATH.split(':') : [],
  plugins: [tailwindPlugin],
  logLevel: 'info',
};

function outputs(metafile) {
  const out = Object.keys(metafile.outputs).map((f) => relative(dist, join(root, f)).split('\\').join('/'));
  return { js: out.filter((f) => f.endsWith('.js')), css: out.filter((f) => f.endsWith('.css')) };
}

if (dev) {
  writeHtml(['assets/main.js'], ['assets/main.css']);
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: dist, port: 5173 });
  console.log(`\n  Color Parking dev server: http://localhost:${port}\n`);
} else {
  const result = await esbuild.build(options);
  const { js, css } = outputs(result.metafile);
  writeHtml(js, css);
  const { version, count } = writeServiceWorker();
  console.log(`\n  Built dist/ — service worker ${version}, ${count} files precached.\n`);
}
