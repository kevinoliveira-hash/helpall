/** Prancha vetorial para o arquivo Figma do projeto; usa a identidade e os exemplos do app. */
import { readFile, writeFile } from "node:fs/promises";
const city = await readFile(
  new URL("../dist/assets/city.svg", import.meta.url),
  "utf8",
);
const logo = await readFile(
  new URL("../dist/assets/help-brand.svg", import.meta.url),
  "utf8",
);
const nested = (source, x, y, w, h) =>
  source
    .replace(/<\?xml[^>]*>/g, "")
    .replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(width|height|x|y)="[^"]*"/g, "")
        .replace("<svg", `<svg x="${x}" y="${y}" width="${w}" height="${h}"`),
    );
const rect = (x, y, w, h, fill, r = 16, stroke = "none") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, value, size = 16, color = "#123b43", weight = 400) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${value}</text>`;
const button = (x, y, w, label, primary = true) =>
  rect(x, y, w, 44, primary ? "#08735c" : "#edf8f2", 12) +
  text(x + 18, y + 28, label, 14, primary ? "#fff" : "#086e59", 700);
const category = (x, y, label, color) =>
  rect(x, y, 102, 100, "#fff", 16, "#e0eae7") +
  rect(x + 33, y + 16, 36, 36, color, 12) +
  text(x + 44, y + 41, "+", 24, "#086e59") +
  text(x + 14, y + 80, label, 12, "#123b43", 700);
const card = (x, y, title, provider, price, fill) =>
  rect(x, y, 248, 236, "#fff", 18, "#e0eae7") +
  rect(x, y, 248, 96, fill, 18) +
  text(x + 20, y + 52, "HELP ALL · PERTO DE VOCÊ", 11, "#30685c", 700) +
  text(x + 18, y + 122, provider, 11, "#627a77") +
  text(x + 18, y + 149, title, 16, "#123b43", 700) +
  text(x + 18, y + 173, "Um exemplo para conhecer o app.", 12, "#627a77") +
  text(x + 18, y + 213, price, 17, "#06424b", 700) +
  rect(x + 199, y + 188, 34, 34, "#edf8f2", 10) +
  text(x + 209, y + 212, "→", 20, "#08735c");
let body =
  rect(0, 0, 2020, 1410, "#eaf0ed", 0) +
  text(60, 66, "HELP ALL", 30, "#063e4b", 700) +
  text(247, 65, "EXPERIÊNCIA 0.4 / BETA", 13, "#52766c", 700) +
  text(
    60,
    105,
    "Mais clareza. Mais cuidado. A mesma rede de ajuda.",
    23,
    "#123b43",
    700,
  ) +
  text(
    60,
    137,
    "Prancha de referência editável · visual implementado no app · 30 OUT 2026",
    14,
    "#627a77",
  );
// Desktop: as áreas de navegação e conteúdo seguem o produto existente.
body +=
  text(60, 193, "01 / DESCOBRIR · DESKTOP", 13, "#52766c", 700) +
  rect(60, 217, 1120, 1060, "#f5f8f7", 22, "#d6e4dd") +
  rect(60, 217, 218, 1060, "#fff", 22) +
  nested(logo, 84, 250, 43, 43) +
  text(138, 278, "Help All", 25, "#06424b", 700) +
  text(86, 326, "SEU MUNDO, MAIS PERTO", 10, "#6a8179", 700);
[
  "Descobrir",
  "Perto de você",
  "Meus pedidos",
  "Comunidade",
  "Help Coins",
  "Meu perfil",
  "Nosso avanço",
].forEach((name, i) => {
  const y = 350 + i * 53;
  if (i === 0) body += rect(78, y, 181, 44, "#063e4b", 12);
  body += text(
    97,
    y + 28,
    name,
    14,
    i === 0 ? "#fff" : "#537568",
    i === 0 ? 700 : 400,
  );
});
body +=
  rect(80, 990, 178, 155, "#edf8f2", 16) +
  text(98, 1020, "PRIMEIROS 100", 10, "#08735c", 700) +
  text(98, 1051, "O começo de", 18, "#123b43", 700) +
  text(98, 1075, "algo bom.", 18, "#123b43", 700) +
  text(98, 1110, "Construído com você.", 12, "#627a77");
body +=
  rect(279, 217, 901, 76, "#fff", 0) +
  text(311, 261, "Pinheiros, SP", 14, "#123b43", 700) +
  rect(1011, 239, 132, 35, "#fff9e9", 17, "#ebdcac") +
  text(1029, 262, "250  HELP", 13, "#765d22", 700) +
  text(311, 331, "Que bom ter você por aqui", 13, "#52766c") +
  rect(310, 352, 838, 314, "#063e4b", 24);
body +=
  text(338, 389, "GENTE AJUDANDO GENTE", 10, "#78dfb8", 700) +
  text(338, 439, "Seu dia mais leve.", 35, "#fff", 700) +
  text(338, 483, "Seu mundo mais perto.", 35, "#55e6b8", 700) +
  text(
    338,
    520,
    "Encontre uma mão amiga. Tudo começa com um help.",
    13,
    "#d0e6e1",
  ) +
  rect(338, 548, 401, 58, "#fff", 13) +
  text(355, 584, "De que ajuda você precisa hoje?", 13, "#718789") +
  rect(685, 555, 46, 44, "#1ed6a0", 10) +
  text(698, 585, "→", 24, "#063e4b") +
  nested(city, 765, 402, 352, 238);
body +=
  text(310, 711, "Um help para cada momento", 23, "#123b43", 700) +
  text(310, 739, "O que você precisa, a poucos toques.", 13, "#627a77");
[
  "Serviços",
  "Comida",
  "Entregas",
  "Mobilidade",
  "Estadias",
  "Bem-estar",
  "Tecnologia",
].forEach(
  (label, i) =>
    (body += category(
      310 + i * 119,
      762,
      label,
      ["#e7f4ed", "#fff0e7", "#eeebfb", "#e9f5ed"][i % 4],
    )),
);
body +=
  text(310, 911, "Boas escolhas perto de você", 23, "#123b43", 700) +
  text(
    310,
    937,
    "Os mesmos exemplos. Mais espaço para escolher.",
    13,
    "#627a77",
  ) +
  card(
    310,
    962,
    "Sua casa, do seu jeito",
    "Marina · Casa em Dia",
    "R$ 140,00",
    "#e8f0df",
  ) +
  card(
    589,
    962,
    "O burger do seu intervalo",
    "Quintal Burger",
    "R$ 34,90",
    "#ffead9",
  ) +
  card(
    868,
    962,
    "Resolve uma entrega?",
    "Lucas · Vai de Bike",
    "R$ 16,00",
    "#e5f2ed",
  );
// Celular: prioridade para leitura, toque e fluxo contínuo.
body +=
  text(1220, 193, "02 / NO CELULAR", 13, "#52766c", 700) +
  rect(1220, 217, 350, 943, "#fff", 29, "#d6e4dd") +
  text(1241, 255, "Pinheiros, SP", 12, "#123b43", 700) +
  rect(1457, 234, 90, 32, "#fff9e9", 16) +
  text(1470, 255, "250 HELP", 11, "#765d22", 700) +
  rect(1236, 290, 318, 334, "#063e4b", 20) +
  text(1256, 322, "GENTE AJUDANDO GENTE", 9, "#78dfb8", 700) +
  text(1256, 369, "Seu dia mais leve.", 28, "#fff", 700) +
  text(1256, 406, "Seu mundo mais", 28, "#fff", 700) +
  text(1256, 443, "perto.", 28, "#55e6b8", 700) +
  text(1256, 481, "Encontre uma mão amiga.", 12, "#d0e6e1") +
  text(1256, 503, "Tudo começa com um help.", 12, "#d0e6e1") +
  rect(1256, 538, 277, 53, "#fff", 12) +
  text(1271, 570, "De que ajuda você precisa?", 11, "#718789") +
  rect(1486, 544, 40, 41, "#1ed6a0", 9) +
  text(1498, 571, "→", 20, "#063e4b") +
  text(1239, 672, "Um help para cada momento", 19, "#123b43", 700);
["Serviços", "Comida", "Entregas"].forEach(
  (label, i) =>
    (body += category(
      1237 + i * 107,
      694,
      label,
      ["#e7f4ed", "#fff0e7", "#eeebfb"][i],
    )),
);
body +=
  text(1239, 837, "Boas escolhas perto de você", 19, "#123b43", 700) +
  rect(1237, 860, 315, 206, "#f6faf7", 17, "#e0eae7") +
  text(1255, 895, "Marina · Casa em Dia", 12, "#627a77") +
  text(1255, 927, "Sua casa, do seu jeito", 19, "#123b43", 700) +
  text(1255, 956, "Limpeza cuidadosa para o seu dia.", 13, "#627a77") +
  text(1255, 999, "R$ 140,00", 21, "#06424b", 700) +
  button(1255, 1018, 275, "Conhecer este help") +
  rect(1221, 1089, 348, 70, "#fff", 0) +
  text(
    1241,
    1129,
    "Início     Mapa     Pedidos    Comunidade",
    11,
    "#08735c",
    700,
  );
body +=
  text(1610, 193, "03 / SISTEMA VISUAL", 13, "#52766c", 700) +
  rect(1610, 217, 350, 1060, "#fff", 22, "#d6e4dd") +
  text(1635, 258, "Confiança, com calor humano.", 20, "#123b43", 700) +
  text(1635, 289, "Tokens usados na implementação", 13, "#627a77");
[
  ["Petróleo", "#063e4b"],
  ["Esmeralda", "#08735c"],
  ["Menta", "#1ed6a0"],
  ["Dourado", "#c9a856"],
  ["Superfície", "#f5f8f7"],
].forEach(([label, color], i) => {
  const y = 320 + i * 72;
  body +=
    rect(1635, y, 48, 48, color, 13, "#e0eae7") +
    text(1699, y + 20, label, 14, "#123b43", 700) +
    text(1699, y + 41, color, 12, "#627a77");
});
body +=
  text(1635, 730, "Tipografia", 18, "#123b43", 700) +
  text(1635, 770, "Manrope / títulos", 23, "#063e4b", 700) +
  text(1635, 802, "DM Sans / leitura e interface", 14, "#627a77") +
  text(1635, 863, "Ações confortáveis", 18, "#123b43", 700) +
  button(1635, 886, 298, "Continuar no beta") +
  button(1635, 944, 298, "Explorar possibilidades", false) +
  text(1635, 1035, "44 px ou mais nas ações principais", 12, "#627a77") +
  text(1635, 1061, "Foco visível · leitura com contraste", 12, "#627a77") +
  text(1635, 1087, "Movimento reduzido respeitado", 12, "#627a77") +
  text(1635, 1160, "HELP é ilustrativo no beta.", 13, "#765d22", 700) +
  text(1635, 1186, "Os exemplos e fluxos foram mantidos.", 12, "#627a77");
body +=
  text(60, 1342, "HELP ALL · Juntos por um mundo melhor", 20, "#063e4b", 700) +
  text(
    60,
    1373,
    "A prancha documenta a direção visual; o app funcional permanece como fonte da experiência.",
    13,
    "#627a77",
  );
await writeFile(
  new URL("../design-references/HELP-ALL-experiencia-04.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" width="2020" height="1410" viewBox="0 0 2020 1410">${body}</svg>`,
);
console.log(
  "Prancha vetorial criada em design-references/HELP-ALL-experiencia-04.svg",
);
