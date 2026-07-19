import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from 'html-minifier';
import { cmdRegPack } from 'regpack';

const options = {
  toplevel: true,
  compress: {
    passes: 2,
    unsafe: true,
    unsafe_arrows: true,
    unsafe_comps: true,
    unsafe_math: true,
    booleans_as_integers: true,
  },
  mangle: {
    properties: {
      keep_quoted: true,
    },
    // Don't mangle some characters as they're used in the packed code.
    // This is needed to have duplicate CSS strings that pack well.
    // And for .forEach(x,y) to have super consistent x,y names
    reserved: [],
  },
  format: {
    wrap_func_args: false,
    quote_style: 1,
  },
};

const html = readFileSync('src/index.html', 'utf8');

const preprocessJs = js => js
  // Minify inline SVG literals (matched anywhere, so a wrapper element around
  // the <svg> in the same template literal is fine)
  .replace(/<svg[\s\S]*?<\/svg>/g, rawSvg => rawSvg
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*=\s*/g, '=')
      .replace(/\s+\/>/g, '/>')
      .replace(/\s+>/g, '>')
      .replace(/\s+([a-zA-Z_:][-a-zA-Z0-9_:.]*)=/g, ' $1=')
      // Drop quotes only when the value is safely unquoted in HTML/SVG parsing
      .replace(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)=["']([#a-zA-Z0-9.,_:-]+)["']/g, ' $1=$2')
      // Prevent '/>' from being consumed as part of the final unquoted attribute value.
      .replace(/=([#a-zA-Z0-9.,_:-]+)\/>/g, '=$1 />')
      .trim())
  // Minify CSS template literals
  .replace(/`[^`]+`/g, tag => tag
    .replace(/`\s+/, '`')
    .replace(/\s+`/, '`')
    .replace(/="\s+/g, '="')
    .replace(/\s+"/g, '"')
    .replace(/>\s+</g, '><')
    .replace(/:\s/g, ':')
    .replace(/,\s/g, ',')
    .replace(/(%) ([\d$])/g, '$1$2')
    .replace(/\s\/\s/g, '/')
    .replace(/;\s+/g, ';')
    .replace(/\)\s/g, ')')
    .replace(/;"/g, '"')
    .replace(/;`/, '`')
    .replace(/\)\`/g, '`')
  )
  .replace(/createElement\('([^']+)'\)/g, 'createElement`$1`')
  .replaceAll('const ', 'let ')
  .replaceAll('.forEach(', '.map(')
  .replaceAll('===', '==')
  .replaceAll('!==', '!=');

const finalizeJs = minifiedJsCode => minifiedJsCode
  .replaceAll('()=>', 't=>')
  .replace(/(['"])(<svg[\s\S]*?<\/svg>)\1/g, (full, quote, svg) => `\`${svg}\``)
  .replace(/rotate \.([\d.]+s)/g, 'rotate.$1')
  .replace(/'([^'`$\\\r\n]*)'/g, '`$1`')
  .replace(/;$/, '');

const buildVariant = async ({ inputJsPath, nonPackedOut, watchOut, htmlOut, prettyDirOut, logLabel }) => {
  const preprocessed = preprocessJs(readFileSync(inputJsPath, 'utf8'));
  const minifiedJs = await minifyJs(preprocessed, options);
  const code = finalizeJs(minifiedJs.code);

  const packed = cmdRegPack(code, {
    withMath: true,
    varsNotReassigned : [
      'a',
      's',
      'w',
    ],
    crushGainFactor: parseFloat(2),
    crushLengthFactor: parseFloat(1),
    crushCopiesFactor: parseFloat(1),
  });

  const inlined = html.replace(/<script[^>]*><\/script>/, () => `<script>${packed}</script>`);
  const inlinedNonPacked = html.replace(/<script[^>]*><\/script>/, () => `<script>${code}</script>`);

  const minifiedInlined = minifyHtml(inlined, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
  });

  const minifiedInlinedNonPacked = minifyHtml(inlinedNonPacked, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
  });

  const mangled = minifiedInlined
    .replace('<!DOCTYPE html><html>', '')
    .replace(';</script>', '</script>')
    .replace('<head>', '')
    .replace('</head>', '')
    .replace('"initial-scale=1"', 'initial-scale=1')
    .replace('</body></html>', '');

  if (logLabel) {
    console.log(`${logLabel}: ${new Blob([mangled]).size}B`);
  }
  if (nonPackedOut) {
    writeFileSync(nonPackedOut, minifiedInlinedNonPacked);
  }
  if (watchOut) {
    writeFileSync(watchOut, minifiedInlined);
  }
  if (htmlOut) {
    writeFileSync(htmlOut, mangled);
  }
  if (prettyDirOut) {
    mkdirSync(prettyDirOut, { recursive: true });
    writeFileSync(`${prettyDirOut}/index.html`, mangled);
  }
};

await buildVariant({
  inputJsPath: 'src/main-ios.js',
  htmlOut: 'ios.html',
  prettyDirOut: 'ios',
  logLabel: 'ios with HTML',
});

await buildVariant({
  inputJsPath: 'src/main.js',
  nonPackedOut: 'index.nonpacked.html',
  watchOut: 'index.watch.html',
  htmlOut: 'index.html',
  logLabel: 'with HTML',
});
