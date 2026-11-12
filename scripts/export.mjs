// Optional hosting helper. Opening index.html directly requires no build.
import { mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'content.js', 'app.js', 'theme.css', 'styles.css', 'assets', '.nojekyll', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}
console.log(`Static site exported to ${fileURLToPath(output)}`);
