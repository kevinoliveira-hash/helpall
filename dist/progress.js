/** Status editorial do projeto. Não representa uma medição automática de produção.
 * Atualize esta lista a cada entrega; métricas globais dependem do banco/analytics.
 */
export const RELEASE = "0.4 beta";
export const MILESTONES = Object.freeze([
  {
    title: "Entrada beta simplificada",
    detail: "Nome e cidade, sem senha e sem depender do banco.",
    done: true,
  },
  {
    title: "Catálogo e busca",
    detail: "Categorias, favoritos, mapa e exemplos de serviços.",
    done: true,
  },
  {
    title: "Pedidos e comunidade de demonstração",
    detail: "Fluxos locais para experimentar a proposta.",
    done: true,
  },
  {
    title: "HelpCoins ilustrativas",
    detail: "Carteira, missões, extrato e resgates simulados.",
    done: true,
  },
  {
    title: "Feedback e exportação",
    detail: "Opiniões e dados locais podem ser exportados pelo perfil.",
    done: true,
  },
  {
    title: "Preparação para Vercel",
    detail: "Configuração de deploy e código editável no VS Code.",
    done: true,
  },
  {
    title: "Publicação pública na Vercel",
    detail:
      "Versão publicada em helpall-delta.vercel.app, aberta sem login externo.",
    done: true,
  },
  {
    title: "Contas e dados compartilhados",
    detail: "Concluir a operação do Supabase e testar cadastros reais.",
    done: false,
  },
  {
    title: "Login com Google",
    detail: "Criar as credenciais OAuth e validar o acesso completo.",
    done: false,
  },
  {
    title: "Acompanhamento dos 100 participantes",
    detail: "Conectar métricas agregadas e feedback centralizado.",
    done: false,
  },
]);

export function renderProgress(state, feedbackCount = 0) {
  const done = MILESTONES.filter((item) => item.done).length;
  const metrics = [
    [state.orders.length, "pedidos de teste"],
    [state.posts.length, "publicações locais"],
    [state.coins.ledger.length, "movimentos de HELP"],
    [feedbackCount, "opiniões neste navegador"],
  ];
  return `<div class="page-heading"><div><span class="eyebrow">ACOMPANHE A CONSTRUÇÃO</span><h1>Nosso avanço, às claras.</h1><p class="muted">Versão ${RELEASE} · Atualizado em 30/10/2026</p></div><span class="tag green">BETA DE APRESENTAÇÃO</span></div>
  <section class="panel"><h2>${done} de ${MILESTONES.length} etapas entregues</h2><p class="muted">Etapas de produto registradas pela equipe. Esta lista não mede percentual de segurança nem prontidão para operações reais.</p><progress class="release-progress" max="${MILESTONES.length}" value="${done}" aria-label="Etapas entregues">${done}/${MILESTONES.length}</progress>
  <div class="milestone-list">${MILESTONES.map((item) => `<article class="milestone"><span class="tag ${item.done ? "green" : ""}">${item.done ? "Entregue" : "Próxima etapa"}</span><div><h3>${item.title}</h3><p class="muted">${item.detail}</p></div></article>`).join("")}</div></section>
  <section><div class="section-heading"><div><h2>Seu teste nesta versão</h2><p class="muted">Somente as ações salvas neste navegador. Não são totais dos convidados.</p></div></div><div class="info-grid">${metrics.map(([value, label]) => `<div class="info-card"><strong>${value}</strong><span>${label}</span></div>`).join("")}</div></section>
  <section class="panel"><h2>O que aprendemos com você?</h2><p class="muted">Teste um pedido, publique um help e conte o que ajudou ou dificultou. As opiniões ficam locais por enquanto; exporte a sessão para compartilhar com a equipe por um canal de sua escolha.</p><div class="progress-actions"><button class="button primary" data-action="feedback">Dar minha opinião</button><button class="button secondary" data-action="export-data">Exportar esta sessão</button></div><p class="muted">A contagem global de cadastros, visitas e retenção será conectada em uma próxima etapa. Nenhum contador de usuários é inventado nesta tela.</p></section>`;
}
