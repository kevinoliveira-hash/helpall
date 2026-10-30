const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  bag: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 10v-3a5 5 0 0 0-3-4"/>',
  wallet:
    '<path d="M20 8V5a2 2 0 0 0-2-2L5 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1 0-4"/><path d="M20 12h-5v5h5"/><circle cx="16.5" cy="14.5" r=".5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M8 7v10m8-10v10M8 12h8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 13h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  tool: '<path d="M14.5 5.5a6 6 0 0 0-7 7L2 18l4 4 5.5-5.5a6 6 0 0 0 7-7L15 13l-4-4Z"/>',
  utensils: '<path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v19m12 0V3c-4 2-5 8 0 10"/>',
  package:
    '<path d="m3 7 9-5 9 5v10l-9 5-9-5Zm0 0 9 5 9-5M12 12v10M7 4l10 6"/>',
  car: '<path d="m5 6-2 7v7h3v-3h12v3h3v-7l-2-7Zm-2 7h18M7 6l1-3h8l1 3"/><path d="M6 14v1m12-1v1"/>',
  monitor:
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  paw: '<ellipse cx="12" cy="16" rx="5" ry="4"/><ellipse cx="5" cy="9" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="16" cy="5" rx="2" ry="3"/><ellipse cx="21" cy="10" rx="2" ry="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield:
    '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  message:
    '<path d="M21 11a9 9 0 0 1-9 9H7l-5 3 2-6a9 9 0 1 1 17-6Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
  gift: '<path d="M3 8h18v5H3Zm2 5v9h14v-9M12 8v14"/><path d="M12 8C2 8 5 0 9 3l3 5Zm0 0c10 0 7-8 3-5Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
  leaf: '<path d="M20 3C7 1 2 6 4 14c1 5 11 8 14 1 2-4 2-8 2-12ZM5 19 16 8"/>',
  sparkles:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM21 2v4m-2-2h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  chart: '<path d="M3 3v18h19M7 16l5-5 4 2 5-7"/>',
  flag: '<path d="M4 22V3c6-4 10 4 16 0v12c-6 4-10-4-16 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.01"/>',
};
export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
}
