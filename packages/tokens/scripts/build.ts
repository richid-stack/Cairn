import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildCss } from '../src/css.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
mkdirSync(dist, { recursive: true });
writeFileSync(`${dist}tokens.css`, buildCss());
console.log('wrote dist/tokens.css');
