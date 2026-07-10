import { readFileSync, writeFileSync } from 'fs';
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
    reserved: ['a', 'b', 'c', 'd', 'e'],
  },
  format: {
    wrap_func_args: false,
  },
};

let js = readFileSync('src/main.js', 'utf8');

// Some custom mangling of JS to assist / work around Terser
js = js
  // Minify inline SVG literals
  .replace(/const sheepSvg\s*=\s*`([\s\S]*?)`;/, (full, rawSvg) => `const sheepSvg = \`${rawSvg
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*=\s*/g, '=')
      .replace(/\s+\/>/g, '/>')
      .replace(/\s+>/g, '>')
      .replace(/\s+([a-zA-Z_:][-a-zA-Z0-9_:.]*)=/g, ' $1=')
      .trim()}\`;`)
  // Minify CSS template literals
  .replace(/`[^`]+`/g, tag => tag
    .replace(/`\s+/, '`')  // Remove newlines & spaces at start or string
    // .replace(/\n\s+/g, ' ') // Shrink newlines & spaces within values
    .replace(/:\s/g, ':')  // Remove spaces in between property & values`
    .replace(/,\s/g, ',') // Remove space after commas
    .replace(/(%) ([\d$])/g, '$1$2') // Remove space between e.g. '100% 50%'
    .replace(/\s\/\s/g, '/') // Remove spaces around `/` in hsl
    .replace(/;\s+/g, ';') // Remove newlines & spaces after semicolons
    .replace(/\)\s/g, ')') // Remove spaces after closing brackets
    .replace(/;`/, '`') // Remove final semicolons
    .replace(/\)\`/g, '`') // Remove closing brackets usually at the end of calc
  )
  // createElement('div') -> createElement`div`
  .replace(/createElement\('([^']+)'\)/g, 'createElement`$1`')
  // Shorten tubeIndex to a to avoid reassignment by terser.
  // RegPack also doesn't reassign 'a','b','c' by default.
//   .replaceAll('tubeObject', 'a')
  // 'b' is reserved for the document body
//   .replaceAll('tubeIndex', 'c')
  // Resting disabling renaming eye variables for now
  // .replaceAll('eyeElement', 'd')
  // .replaceAll('eyeIndex', 'e')
  // Replace timerELement with 'd' *as well* (doesn't help?)
  // .replaceAll('timerElement', 'd')
  // Replace tubeElement with 'd' *as well* (doesn't help?)
  // .replaceAll('tubeElement', 'd')
  // Replace const with let declaration
  .replaceAll('const ', 'let ')
  // Replace all .forEach with .map because they're the same but shorter in this codebase
  .replaceAll('.forEach(', '.map(')
  // Replace all strict equality comparison with abstract equality comparison
  .replaceAll('===', '==')
  .replaceAll('!==', '!=')

const minifiedJs = await minifyJs(js, options);

const code = minifiedJs.code
  // Global variables on window instead of var, let or const
//   .replace('let t=', 't=')
//   .replace('let t,', 't,')

  // Remove unnecessary parentheses around a little maps that doesn't need them.
  // Actually adds ~1B
  // .replaceAll('{d.remove()}', 'd.remove()')
  // .replaceAll('t=>{t?.remove()}', 't=>t?.remove()')

  // Replace '=()=>' with '=v=>'. Actually increases size by 2B
  // .replaceAll('=()=>', '=v=>')

  // Replace all double quotes with backticks for consistency
//   .replaceAll('"', '`')

  // Replace -100px in calc with something that compresses better. Actually adds 3B
  // .replaceAll('- -100px', '- ${-100}px')

  // Attempt at replacing sizes with sizes that take fewer characters
  // .replaceAll('116px', '3cm')
  // .replaceAll('100px', '1in')

  // .replaceAll('19', '16+3') // Failed attempt to remove '9' to save bytes
  // Remove final semicolon
  .replace(/;$/, '');

const packed = cmdRegPack(code, {
  // withMath: true, // Sometimes worth wrapping with Math()
  varsNotReassigned : [
    'a',
    // 'b', // used in rgb()
    'c',
    // 'd',
    's', // Used for sheep SVG element
  ],
  // RegPack crush options figured out with trial and error on siorki.github.io/regPack.html
  crushGainFactor: parseFloat(2),
  crushLengthFactor: parseFloat(1),
  crushCopiesFactor: parseFloat(1),
});

const html = readFileSync('src/index.html', 'utf8');

const inlined = html.replace(
  /<script[^>]*><\/script>/,
  `<script>${packed}</script>`,
);

const inlinedNonPacked = html.replace(
  /<script[^>]*><\/script>/,
  `<script>${code}</script>`,
);

const minifiedInlined = minifyHtml(inlined, {
  removeAttributeQuotes: true,
  collapseWhitespace: true,
});

const minifiedInlinedNonPacked = minifyHtml(inlinedNonPacked, {
  removeAttributeQuotes: true,
  collapseWhitespace: true,
});

const mangled = minifiedInlined
  .replace('<!DOCTYPE html><html>', '') // Remove doctype & HTML opening tags
  .replace(';</script>', '</script>') // Remove final semicolon
  .replace('<head>', '') // Remove head opening tag
  .replace('</head>', '') // Remove head closing tag
  .replace('"initial-scale=1"', 'initial-scale=1') // Remove initial-scale quotes
  .replace('</body></html>', ''); // Remove closing tags

console.log(`with HTML: ${new Blob([mangled]).size}B`);

writeFileSync('index.nonpacked.html', minifiedInlinedNonPacked);
writeFileSync('index.watch.html', minifiedInlined);
writeFileSync('index.html', mangled);