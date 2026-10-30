import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, SERVICES, INITIAL_POSTS, DEMO_PROVIDERS } from '../dist/data.js';
import { icon } from '../dist/icons.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const unique = values => new Set(values).size === values.length;

async function assertLocalFile(reference) {
  assert.equal(typeof reference, 'string');
  assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(reference), `Asset deve ser local: ${reference}`);
  const filename = path.resolve(dist, reference);
  assert.ok(filename.startsWith(dist), `Asset fora da pasta do app: ${reference}`);
  assert.ok((await stat(filename)).isFile(), `Arquivo ausente: ${reference}`);
  return filename;
}

test('catalog categories and providers have stable unique identifiers and valid references', () => {
  assert.ok(CATEGORIES.length > 1);
  assert.ok(SERVICES.length > 0);
  assert.ok(unique(CATEGORIES.map(c => c.id)), 'Categorias duplicadas');
  assert.ok(unique(SERVICES.map(s => s.id)), 'Serviços duplicados');
  assert.ok(unique(DEMO_PROVIDERS.map(p => p.id)), 'Prestadores duplicados');
  assert.equal(CATEGORIES.filter(c => c.id === 'all').length, 1);
  for (const category of CATEGORIES) {
    assert.ok(category.label.trim());
    const expected = category.id === 'all' ? SERVICES.length : SERVICES.filter(s => s.category === category.id).length;
    assert.equal(category.count, expected, `Contagem incorreta: ${category.id}`);
  }
  for (const service of SERVICES) {
    assert.ok(CATEGORIES.some(c => c.id === service.category && c.id !== 'all'), `Categoria não encontrada: ${service.id}`);
    assert.ok(DEMO_PROVIDERS.some(p => p.id === service.id && p.provider === service.provider && p.category === service.category && p.rating === service.rating), `Prestador inconsistente: ${service.id}`);
  }
});

test('catalog cards contain complete finite prices, reviews and illustrative coordinates', () => {
  for (const service of SERVICES) {
    for (const field of ['title', 'description', 'provider', 'unit', 'eta']) assert.ok(typeof service[field] === 'string' && service[field].trim(), `${service.id}: ${field}`);
    assert.ok(Number.isFinite(service.price) && service.price >= 0, service.id);
    assert.ok(Number.isFinite(service.rating) && service.rating >= 0 && service.rating <= 5, service.id);
    assert.ok(Number.isSafeInteger(service.reviews) && service.reviews >= 0, service.id);
    assert.ok(Number.isFinite(service.distance) && service.distance >= 0, service.id);
    assert.ok(Number.isFinite(service.lat) && Math.abs(service.lat) <= 90, service.id);
    assert.ok(Number.isFinite(service.lng) && Math.abs(service.lng) <= 180, service.id);
    assert.equal(typeof service.featured, 'boolean', service.id);
    assert.ok(Array.isArray(service.details) && service.details.length > 0 && service.details.every(d => typeof d === 'string' && d.trim()), service.id);
  }
});

test('every catalog illustration exists locally and contains a complete SVG', async () => {
  const references = [...new Set(SERVICES.map(s => s.image)), './assets/logo.svg', './assets/city.svg'];
  await Promise.all(references.map(async reference => {
    const filename = await assertLocalFile(reference);
    const content = await readFile(filename, 'utf8');
    assert.match(content, /<svg\b[^>]*\bviewBox=/, reference);
    assert.match(content.trim(), /<\/svg>$/, reference);
    assert.doesNotMatch(content, /<script\b|\bonload\s*=/i, reference);
  }));
});

test('every category and literal app icon resolves to its own SVG shape', async () => {
  const appSource = await readFile(path.join(dist, 'app.js'), 'utf8');
  const names = new Set([...CATEGORIES.map(c => c.icon), ...[...appSource.matchAll(/icon\(\s*['"]([^'"]+)['"]/g)].map(match => match[1])]);
  const fallback = icon('__missing__');
  for (const name of names) {
    const rendered = icon(name);
    assert.match(rendered, /^<svg\b.*<\/svg>$/, name);
    assert.match(rendered, /aria-hidden="true"/, name);
    if (name !== 'heart') assert.notEqual(rendered, fallback, `Ícone não definido: ${name}`);
  }
});

test('seed community posts are distinct and renderable with valid illustrative rewards', () => {
  assert.ok(unique(INITIAL_POSTS.map(p => p.id)), 'IDs de publicação duplicados');
  for (const post of INITIAL_POSTS) {
    assert.ok(post.id && post.author.trim() && post.text.trim());
    assert.ok(['help', 'offer', 'story'].includes(post.kind), post.id);
    assert.ok(Number.isSafeInteger(post.reward) && post.reward >= 0, post.id);
    assert.ok(Number.isSafeInteger(post.likes) && post.likes >= 0, post.id);
    assert.ok(Number.isFinite(Date.parse(post.date)), post.id);
    assert.ok(Array.isArray(post.comments) && post.comments.every(c => c.author.trim() && c.text.trim() && Number.isFinite(Date.parse(c.date))), post.id);
  }
});

test('entry page and install manifest reference existing local application files', async () => {
  const page = await readFile(path.join(dist, 'index.html'), 'utf8');
  assert.match(page, /<html\s+lang="pt-BR"/);
  const localFiles = [...page.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)].map(match => match[1]);
  await Promise.all(localFiles.map(assertLocalFile));
  const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.lang, 'pt-BR');
  assert.ok(manifest.name.includes('HELP ALL'));
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  await Promise.all(manifest.icons.map(item => assertLocalFile(item.src)));
});
