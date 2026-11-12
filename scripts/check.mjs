import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const context = { window: {} };
vm.runInNewContext(await readFile(new URL('content.js', root), 'utf8'), context);
const content = context.window.PAPER_TABS;
assert(content?.projects?.length >= 1 && content.projects.length <= 8, 'Use 1–8 projects.');
assert(content.name && content.title && content.about, 'Name, title, and about are required.');
const assets = ['assets/fonts/Jersey10-Regular.ttf', 'assets/fonts/Jersey10-OFL.txt', 'assets/favicon.svg'];
for (const project of content.projects) {
  assert(project.title && project.summary, 'Each project needs title and summary.');
  if (project.cover) { assert(project.coverAlt, 'Add coverAlt for each cover.'); assets.push(project.cover); }
  if (project.url) assert(/^https?:\/\//.test(project.url), 'Project URLs must start with https:// or http://.');
}
for (const item of content.decorations || []) if (item.src) assets.push(item.src);
if (content.avatar) assets.push(content.avatar);
if (content.resume) assets.push(content.resume);
for (const path of assets) if (!/^https?:\/\//.test(path)) await access(new URL(path, root));
new vm.Script(await readFile(new URL('app.js', root), 'utf8'));
console.log(`OK: ${content.projects.length} projects, ${assets.length} assets, valid JavaScript.`);
