import {createStore, MISSIONS, REWARDS} from './store.js';
import {CATEGORIES, SERVICES, INITIAL_POSTS} from './data.js';
import {icon} from './icons.js';

const store = createStore();
const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal-root');
const routes = ['home','explore','nearby','orders','community','wallet','profile','impact','favorites'];
let route = routes.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let category = 'all', query = '', sort = 'recommended', orderTab = 'all', communityTab = 'all';
let topRated = false, selectedMap = null, lastFocus = null;
const safeRead = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
const safeWrite = (key, value) => {try {localStorage.setItem(key, JSON.stringify(value));return true;} catch {toast('Não foi possível salvar neste navegador.');return false;}};
let social = safeRead('help-all-social-v1', {});
if(!social || typeof social !== 'object' || Array.isArray(social)) social = {};
for(const id of Object.keys(social)){const entry=social[id];if(!entry||typeof entry!=='object'||Array.isArray(entry)){delete social[id];continue;}if(!Array.isArray(entry.comments))entry.comments=[];}
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);
const number = value => new Intl.NumberFormat('pt-BR').format(Number(value)||0);
const date = value => {const d = new Date(value);return Number.isNaN(d.getTime()) ? 'Agora' : new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(d);};
const initials = value => String(value||'V').trim().split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase();
const btn = (label, action, extra='', cls='primary') => `<button class="button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const notice = text => `<div class="notice">${icon('info')}<span>${text}</span></div>`;
const heading = (eyebrow,title,description='',action='') => `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${description?`<p class="muted">${description}</p>`:''}</div>${action}</div>`;
const sectionHead = (title,subtitle='',action='') => `<div class="section-heading"><div><h2>${title}</h2>${subtitle?`<p class="muted">${subtitle}</p>`:''}</div>${action}</div>`;
const empty = (title,description,action='') => `<div class="empty-state"><div class="empty-icon">${icon('sparkles')}</div><h3>${title}</h3><p>${description}</p>${action}</div>`;
const statusLabels = {solicitado:'Pedido enviado',confirmado:'Confirmado',a_caminho:'Em andamento',concluido:'Concluído',cancelado:'Cancelado'};
const steps = ['solicitado','confirmado','a_caminho','concluido'];
const NAV = [['home','grid','Descobrir'],['nearby','map','Perto de você'],['orders','bag','Meus pedidos'],['community','users','Comunidade'],['wallet','wallet','Help Coins']];

function navLink(id, name, label, mobile=false) {
  const count = store.getState().orders.filter(o=>!['concluido','cancelado'].includes(o.status)).length;
  return `<a href="#${id}" class="${mobile?'bottom-nav-item':'nav-item'} ${route===id||(id==='home'&&route==='explore')?'active':''}" ${route===id?'aria-current="page"':''}>${icon(name)}<span>${label}</span>${id==='orders'&&count&&!mobile?`<span class="nav-count">${count}</span>`:''}</a>`;
}
function render() {
  const state = store.getState();
  const name = state.profile.name === 'Visitante' ? 'você' : state.profile.name.split(' ')[0];
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar"><a href="#home" class="brand" aria-label="HELP ALL início"><img class="brand-mark" src="./assets/logo.svg" alt=""><div><span class="brand-name">help<span>all</span><span class="brand-dot">.</span></span><span class="brand-tag">AJUDAR CONECTA</span></div></a>
    <span class="menu-caption">SEU MUNDO, MAIS PERTO</span><nav class="nav-list" aria-label="Menu principal">${NAV.map(n=>navLink(...n)).join('')}</nav>
    <div class="sidebar-divider"></div><nav class="nav-list" aria-label="Pessoal">${navLink('favorites','heart','Meus favoritos')}${navLink('profile','user','Meu perfil')}${navLink('impact','chart','Nosso impacto')}</nav>
    <div class="sidebar-bottom"><div class="pilot-mini"><span class="tag green">${icon('leaf')} PRIMEIROS 100</span><h3>O começo de algo bom.</h3><p>Explore, experimente e ajude a construir o HELP ALL.</p><button class="link-button" data-action="feedback">Dar minha opinião ${icon('arrow')}</button></div><button class="sidebar-help" data-action="about">${icon('help')} Conheça o projeto ${icon('chevron')}</button><span class="sidebar-version">Versão 0.1 · Feito para conectar</span></div></aside>
    <div class="main-shell"><header class="topbar"><button class="location-button" data-action="location">${icon('pin')}<span class="location-copy"><small>EXPLORANDO EM</small><strong>${esc(state.location.neighborhood || state.location.city)}, ${esc(state.location.city === 'São Paulo'?'SP':state.location.city)}</strong></span>${icon('down')}</button><div class="topbar-actions"><span class="demo-label"><i></i> Piloto demonstrativo</span><button class="coin-pill" data-action="navigate" data-route="wallet" aria-label="Abrir carteira, ${state.coins.balance} Help Coins">${icon('coin')}<strong>${number(state.coins.balance)}</strong><span>HELP</span></button><button class="icon-button notifications" data-action="notifications" aria-label="Notificações">${icon('bell')}<span class="notification-dot"></span></button><button class="avatar" data-action="navigate" data-route="profile" aria-label="Abrir meu perfil">${esc(initials(state.profile.name))}</button></div></header>
    <main class="content" id="main-content" tabindex="-1">${({home:()=>home(name),explore,nearby,orders,community,wallet,profile,impact,favorites})[route]()}</main>
    <footer class="app-footer"><span>Uma comunidade. Muitas possibilidades.</span><button data-action="about">Sobre esta demonstração ${icon('info')}</button></footer></div>
    <nav class="bottom-nav" aria-label="Navegação do celular">${NAV.map(n=>navLink(n[0],n[1],n[0]==='home'?'Início':n[0]==='nearby'?'Mapa':n[0]==='orders'?'Pedidos':n[0]==='wallet'?'Coins':'Comunidade',true)).join('')}</nav></div>`;
  document.title = `HELP ALL · ${{home:'Ajudar conecta',explore:'Explore possibilidades',nearby:'Perto de você',orders:'Meus pedidos',community:'Comunidade',wallet:'Help Coins',profile:'Meu perfil',impact:'Nosso impacto',favorites:'Favoritos'}[route]}`;
}
function searchBox() {return `<form class="search-box" id="search-form" role="search">${icon('search')}<input name="query" aria-label="Buscar no HELP ALL" placeholder="De que ajuda você precisa hoje?" value="${esc(query)}" maxlength="100"><button type="submit" aria-label="Buscar">${icon('arrow')}</button></form>`;}
function home(name) {
  return `<div class="welcome-line"><span>Que bom ter ${esc(name)} por aqui ${icon('sparkles')}</span><span class="tag neutral">CONEXÕES QUE TRANSFORMAM</span></div>
  <section class="hero"><div class="hero-copy"><span class="hero-kicker"><span></span> GENTE AJUDANDO GENTE</span><h1>Seu dia mais leve.<br>Seu mundo <em>mais perto.</em></h1><p>Encontre uma mão amiga, descubra serviços e faça boas conexões. Tudo começa com um help.</p>${searchBox()}<div class="popular-searches"><span>Experimente:</span><button data-action="quick-search" data-query="reparos">reparos</button><button data-action="quick-search" data-query="comida">comida boa</button><button data-action="publish" data-kind="help">uma mão amiga ${icon('arrow')}</button></div></div><div class="hero-art"><img src="./assets/city.svg" alt="Pessoas, serviços e boas conexões em um bairro conectado"></div></section>
  <section class="section categories-section">${sectionHead('Um help para cada momento','O que você precisa, a poucos toques.',`<button class="section-link" data-action="navigate" data-route="explore">Explorar tudo ${icon('arrow')}</button>`)}<div class="category-grid">${CATEGORIES.filter(c=>c.id!=='all').map(c=>`<button class="category-card" data-action="category" data-category="${c.id}"><span class="category-icon cat-${c.id}">${icon(c.icon)}</span><span class="category-label">${esc(c.label)}</span><span class="category-count">${esc(c.description||'Encontre seu help')}</span></button>`).join('')}</div></section>
  <section class="section">${sectionHead('Boas escolhas perto de você','Pessoas e negócios que fazem o bairro acontecer.',`<button class="section-link" data-action="navigate" data-route="nearby">${icon('map')} Ver no mapa</button>`)}<div class="filter-row">${[['all','Para você'],['services','Serviços'],['food','Comida'],['delivery','Entregas'],['care','Bem-estar']].map(([id,label])=>`<button class="filter-chip ${category===id?'active':''}" data-action="home-filter" data-category="${id}">${label}</button>`).join('')}<span class="demo-catalog-note">Catálogo de demonstração</span></div><div class="service-grid">${SERVICES.filter(s=>category==='all'?s.featured:s.category===category).slice(0,3).map(card).join('')}</div></section>
  <section class="promo-grid"><div class="promo-card coins-promo"><div><span class="eyebrow">BOAS AÇÕES CIRCULAM</span><h2>Ajude. Conecte.<br>Ganhe Help Coins.</h2><p>Uma nova forma de reconhecer quem faz a diferença.</p>${btn(`Conhecer minhas coins ${icon('arrow')}`,'navigate','data-route="wallet"','primary')}</div><div class="coin-visual"><span>H</span><i>+25 HELP</i></div></div><div class="promo-card pilot-promo"><span class="tag green">${icon('users')} COMUNIDADE HELP ALL</span><h2>Seu talento pode ser<br>o help de alguém.</h2><p>Compartilhe o que sabe fazer. Ou conte como a comunidade pode ajudar você.</p><div class="hero-actions">${btn(`Oferecer ajuda ${icon('arrow')}`,'publish','data-kind="offer"','secondary')}${btn('Pedir um help','publish','data-kind="help"','ghost')}</div></div></section>
  <div class="trust-strip"><span>${icon('shield')} Conexões com confiança</span><span>${icon('heart')} A ajuda vem primeiro</span><span>${icon('coin')} Reconhecimento que circula</span></div>`;
}
function card(item) {
 const fav = store.getState().favorites.includes(item.id);
 return `<article class="service-card"><div class="service-image"><button class="image-link" data-action="detail" data-id="${item.id}" aria-label="Conhecer ${esc(item.title)}"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy"></button>${item.badge?`<span class="image-badge">${esc(item.badge)}</span>`:''}<button class="favorite-button ${fav?'is-favorite':''}" data-action="favorite" data-id="${item.id}" aria-label="${fav?'Remover dos':'Adicionar aos'} favoritos: ${esc(item.title)}" aria-pressed="${fav}">${icon('heart')}</button></div><div class="service-body"><div class="service-meta"><span>${esc(item.provider)}</span><span class="rating">${icon('star')} ${esc(item.rating)} <small>(${esc(item.reviews)})</small></span></div><h3 class="service-title"><button data-action="detail" data-id="${item.id}">${esc(item.title)}</button></h3><p class="service-description">${esc(item.description)}</p><div class="service-meta service-distance"><span>${icon('pin')} ${number(item.distance)} km</span><span>${icon('clock')} ${esc(item.eta)}</span></div><div class="service-footer"><span class="price">${Number(item.price)===0?'Ajuda voluntária':money(item.price)} <small>${esc(item.unit||'')}</small></span><button class="card-arrow" data-action="detail" data-id="${item.id}" aria-label="Ver ${esc(item.title)}">${icon('arrow')}</button></div></div></article>`;
}
function filteredServices() {
 const normalized = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const q = normalized(query);
 let list = SERVICES.filter(s=>(category==='all'||s.category===category)&&(!topRated||Number(s.rating)>=4.9)&&(!q||normalized([s.title,s.description,s.provider,CATEGORIES.find(c=>c.id===s.category)?.label,...(s.details||[])].join(' ')).includes(q)));
 if(sort==='price') list.sort((a,b)=>a.price-b.price);
 if(sort==='rating') list.sort((a,b)=>b.rating-a.rating);
 if(sort==='distance') list.sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
 return list;
}
function explore() {
 const items = filteredServices();
 return `${heading('DESCUBRA SEU PRÓXIMO HELP','Possibilidades para o seu dia.','Pessoas, talentos e serviços reunidos em um só lugar.')}${searchBox()}<div class="filter-row wrap">${CATEGORIES.map(c=>`<button class="filter-chip ${category===c.id?'active':''}" data-action="category" data-category="${c.id}">${icon(c.icon)} ${esc(c.label)}</button>`).join('')}</div><div class="results-toolbar"><span class="muted">${items.length} ${items.length===1?'possibilidade encontrada':'possibilidades encontradas'}${query?` para “${esc(query)}”`:''}</span><div><button class="filter-chip ${topRated?'active':''}" data-action="top-rated" aria-pressed="${topRated}">${icon('star')} 4,9+</button><label class="sort-label">Ordenar <select id="sort-select" aria-label="Ordenar resultados"><option value="recommended" ${sort==='recommended'?'selected':''}>Recomendados</option><option value="price" ${sort==='price'?'selected':''}>Menor preço</option><option value="rating" ${sort==='rating'?'selected':''}>Melhor avaliação</option><option value="distance" ${sort==='distance'?'selected':''}>Mais próximos</option></select></label></div></div><div class="service-grid">${items.map(card).join('')}</div>${!items.length?empty('Ainda não encontramos esse help.','Tente outro termo ou conte à comunidade o que precisa.',btn('Limpar filtros','clear-search','','secondary')+btn('Pedir à comunidade','publish','data-kind="help"','primary')):''}<p class="catalog-disclaimer">Ofertas, preços, distâncias e avaliações são exemplos para explorar o app.</p>`;
}
function nearby() {
 const selected = SERVICES.find(s=>s.id===selectedMap) || SERVICES[0];
 const lat = Number(selected.lat)||-23.5614, lng = Number(selected.lng)||-46.6911;
 const bbox = [lng-.022,lat-.014,lng+.022,lat+.014].join(',');
 return `${heading('SEU BAIRRO CONECTADO','O próximo help está por perto.','Explore o mapa de demonstração em Pinheiros, São Paulo.',btn('Alterar região','location','','secondary'))}<div class="map-layout"><div class="map-panel"><iframe title="Mapa OpenStreetMap com localização ilustrativa do serviço" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}" loading="lazy" referrerpolicy="no-referrer"></iframe><div class="map-overlay">${icon('pin')} <div><strong>${esc(selected.provider)}</strong><small>Posição ilustrativa · ${number(selected.distance)} km</small></div></div></div><div class="map-list"><h3>Explore os arredores <span class="tag neutral">EXEMPLOS</span></h3>${SERVICES.slice(0,8).map(s=>`<button class="map-item ${s.id===selected.id?'active':''}" data-action="map-select" data-id="${s.id}"><img src="${esc(s.image)}" alt=""><span><strong>${esc(s.title)}</strong><small>${esc(s.provider)} · ${number(s.distance)} km</small><span class="rating">${icon('star')} ${esc(s.rating)} <span class="map-price">${money(s.price)}</span></span></span>${icon('chevron')}</button>`).join('')}<button class="button primary wide" data-action="detail" data-id="${selected.id}">Ver serviço selecionado ${icon('arrow')}</button></div></div>${notice('O mapa é real, fornecido pelo OpenStreetMap. Os prestadores e suas posições são fictícios. A consulta de CEP identifica cidade e bairro; o catálogo desta versão continua sendo o de demonstração em São Paulo.')}`;
}
function orders() {
 const state = store.getState();
 const list = state.orders.filter(o=>orderTab==='all'||(orderTab==='active'?!['cancelado','concluido'].includes(o.status):o.status===orderTab));
 return `${heading('CADA CONEXÃO, UMA HISTÓRIA','Meus pedidos','Acompanhe cada etapa do seu help.',btn(`${icon('plus')} Encontrar um help`,'navigate','data-route="explore"','primary'))}<div class="page-tabs">${[['all','Todos'],['active','Em andamento'],['concluido','Concluídos'],['cancelado','Cancelados']].map(([id,label])=>`<button class="page-tab ${orderTab===id?'active':''}" data-action="order-tab" data-tab="${id}">${label}</button>`).join('')}</div><div class="order-list">${list.length?list.map(orderCard).join(''):empty('Sua próxima conexão começa aqui.','Quando você solicitar um serviço ou oferecer ajuda, poderá acompanhar tudo por aqui.',btn('Explorar possibilidades','navigate','data-route="explore"'))}</div>${notice('Modo demonstração: você controla as etapas do pedido para conhecer a experiência completa. Nenhum prestador é acionado e nenhum valor é cobrado.')}`;
}
function orderCard(order) {
 const idx = steps.indexOf(order.status), done = order.status==='concluido', cancelled = order.status==='cancelado';
 return `<article class="order-card"><div class="order-head"><div class="order-product">${icon(order.category==='community'?'heart':'bag')}<div><small class="muted">#${esc(order.id.slice(-6).toUpperCase())} · ${date(order.createdAt||order.date)}</small><h3>${esc(order.title)}</h3><span class="muted">${esc(order.provider||'Comunidade HELP ALL')}</span></div></div><span class="tag ${done?'green':cancelled?'neutral':'orange'}">${esc(statusLabels[order.status]||order.status)}</span></div>${!cancelled?`<div class="order-steps">${steps.map((step,i)=>`<div class="order-step ${i<=idx?'active':''} ${i<idx?'done':''}"><span>${i<idx?icon('check'):i+1}</span><small>${statusLabels[step]}</small></div>`).join('')}</div>`:''}<div class="order-summary"><span>${order.note?esc(order.note):'Conexão criada na demonstração'}</span><strong>${Number(order.price)===0?'Voluntário':money(order.price)} <small>ilustrativo</small></strong></div><div class="order-actions"><span class="muted">${done?`${icon('coin')} +25 HELP por concluir este help`:order.scheduledAt?`Agendado: ${esc(order.scheduledAt)}`:'Sua conexão está registrada neste navegador.'}</span><div>${btn(`${icon('message')} Conversar`,'chat',`data-id="${order.id}"`,'secondary small')}${!done&&!cancelled?btn('Cancelar','cancel-order',`data-id="${order.id}"`,'ghost small')+btn(`${idx===2?'Concluir help':'Simular próxima etapa'} ${icon('arrow')}`,'advance-order',`data-id="${order.id}"`,'primary small'):done?btn(`${icon('star')} Avaliar`,'rate',`data-id="${order.id}"`,'ghost small'):''}</div></div></article>`;
}
function allPosts() {return [...store.getState().posts,...INITIAL_POSTS.map(p=>({...p,liked:Boolean(social[p.id]?.liked),likes:Number(p.likes||0)+(social[p.id]?.liked?1:0),comments:[...(p.comments||[]),...(Array.isArray(social[p.id]?.comments)?social[p.id].comments:[])]}))];}
function community() {
 const state=store.getState();
 const posts=allPosts().filter(p=>communityTab==='all'||(p.kind||'story')===communityTab);
 return `${heading('NINGUÉM PRECISA RESOLVER TUDO SOZINHO','Uma comunidade. Muitos helps.','Peça ajuda, compartilhe seu talento e transforme o dia de alguém.')}<div class="community-layout"><div><div class="composer"><span class="avatar">${esc(initials(state.profile.name))}</span><button data-action="publish" data-kind="help">O que podemos fazer juntos hoje?</button>${btn(`${icon('plus')} Publicar`,'publish','data-kind="help"','primary small')}</div><div class="filter-row">${[['all','Para você'],['help','Preciso de ajuda'],['offer','Posso ajudar'],['story','Boas histórias']].map(([id,label])=>`<button class="filter-chip ${communityTab===id?'active':''}" data-action="community-tab" data-tab="${id}">${label}</button>`).join('')}</div>${posts.map(postCard).join('')}${!posts.length?empty('Seja a primeira conexão por aqui.','Compartilhe um pedido ou uma oferta de ajuda.',btn('Publicar na comunidade','publish','data-kind="help"')):''}</div><aside class="community-aside"><div class="panel community-manifesto"><div class="round-icon">${icon('heart')}</div><h3>Ajudar transforma.<br>Conectar multiplica.</h3><p>Um conselho, uma hora do seu tempo ou um talento. Todo help pode fazer a diferença.</p>${btn('Oferecer meu talento','publish','data-kind="offer"','secondary wide')}</div><div class="panel"><span class="eyebrow">CORRENTE DO BEM</span><h3>Faça suas coins circularem.</h3><p class="muted">Conheça causas ilustrativas e experimente apoiar uma delas.</p>${campaigns().map(c=>`<div class="campaign-mini"><span>${icon(c.icon)}</span><div><strong>${c.title}</strong><small>${number(c.total)} HELP nesta demonstração</small></div><button class="icon-button" data-action="donate" data-id="${c.id}" aria-label="Apoiar ${c.title}">${icon('arrow')}</button></div>`).join('')}<small class="muted">Campanhas fictícias. Sem repasse de dinheiro.</small></div></aside></div>`;
}
function postCard(post) {
 const kind=post.kind||'story';
 return `<article class="post-card"><div class="post-header"><span class="avatar post-avatar">${esc(post.initials||post.avatar||initials(post.author))}</span><div><strong>${esc(post.author)}</strong><small class="muted">${date(post.date||post.createdAt)} · Comunidade de demonstração</small></div><span class="tag ${kind==='help'?'orange':'green'}">${kind==='help'?'Preciso de um help':kind==='offer'?'Posso ajudar':'Boa história'}</span></div><p class="post-content">${esc(post.text)}</p>${post.reward?`<span class="tag green">${icon('coin')} ${number(post.reward)} HELP propostos · ilustrativo</span>`:''}<div class="post-actions"><button class="${post.liked?'liked':''}" data-action="like" data-id="${post.id}" aria-pressed="${Boolean(post.liked)}">${icon('heart')} ${number(post.likes||0)} apoios</button><button data-action="comments" data-id="${post.id}">${icon('message')} ${(post.comments||[]).length} comentários</button>${kind==='help'?`<button class="offer-help-link" data-action="help-post" data-id="${post.id}">${icon('plus')} Oferecer ajuda</button>`:''}</div></article>`;
}
function campaigns() {
 const donations=store.getState().donations||[];
 return [{id:'food',title:'Mesa cheia, bairro unido',description:'Uma rede de apoio alimentar para famílias do bairro.',icon:'utensils'}, {id:'learning',title:'Conhecimento que aproxima',description:'Aulas e orientação para quem quer dar o próximo passo.',icon:'monitor'},{id:'care',title:'Cuidar também é ajudar',description:'Companhia e apoio no cotidiano de pessoas idosas.',icon:'heart'}].map(c=>({...c,total:donations.filter(d=>d.campaignId===c.id).reduce((sum,d)=>sum+Number(d.amount||0),0)}));
}
function wallet() {
 const state=store.getState(), coins=state.coins;
 return `${heading('QUANDO VOCÊ AJUDA, TODO MUNDO GANHA','Sua ajuda tem valor.','Help Coins reconhecem as boas conexões que você faz.')}<section class="wallet-hero"><div><span class="hero-kicker">MINHA CARTEIRA HELP</span><div class="wallet-balance">${number(coins.balance)} <span>HELP</span></div><p>Pequenos gestos. Novas possibilidades.</p><div class="hero-actions">${btn(`${icon('send')} Transferir`,'transfer','','light')}${btn(`${icon('heart')} Apoiar uma causa`,'donate','','secondary wallet-secondary')}</div></div><div class="wallet-coin">H<span>HELP COIN</span></div><span class="wallet-demo-badge">${icon('info')} Saldo ilustrativo · sem valor monetário</span></section>
  <div class="wallet-grid"><section class="panel"><div class="section-heading"><div><span class="eyebrow">CADA PASSO CONTA</span><h2>Missões para começar</h2></div>${icon('sparkles')}</div><div class="mission-list">${MISSIONS.map(m=>{const claimed=coins.claimedMissions.includes(m.id);return `<div class="mission"><span class="mission-icon">${icon(claimed?'check':'gift')}</span><div><strong>${esc(m.title)}</strong><small>${esc(m.description)}</small></div><div><span class="mission-amount">+${m.amount} HELP</span><button class="button ${claimed?'ghost':'secondary'} small" data-action="claim" data-id="${m.id}" ${claimed?'disabled':''}>${claimed?'Resgatada':'Resgatar'}</button></div></div>`;}).join('')}</div></section><section class="panel"><div class="section-heading"><div><span class="eyebrow">SUA CORRENTE DO BEM</span><h2>Coins em movimento</h2></div>${btn(icon('download'),'export-ledger','aria-label="Baixar extrato"','ghost small')}</div><div class="ledger-list">${[...coins.ledger].reverse().slice(0,10).map(row=>`<div class="ledger-row"><span class="ledger-icon ${row.amount<0?'negative':'positive'}">${icon(row.amount<0?'send':'coin')}</span><div><strong>${esc(row.label)}</strong><small>${date(row.date)}</small></div><strong class="ledger-amount ${row.amount<0?'negative':'positive'}">${row.amount>0?'+':''}${number(row.amount)}<small> HELP</small></strong></div>`).join('')}</div></section></div>
  <section class="section">${sectionHead('Troque coins por novas possibilidades','Experimente resgatar benefícios ilustrativos.')}<div class="reward-grid">${REWARDS.map((r,i)=>`<article class="reward-card"><span class="reward-icon">${icon(['package','tool','flag'][i])}</span><span class="tag neutral">BENEFÍCIO DEMO</span><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="service-footer"><strong>${r.cost} HELP</strong>${btn('Quero resgatar','redeem',`data-id="${r.id}"`,'secondary small')}</div></article>`).join('')}</div></section>${coins.redeemedRewards.length?`<section class="section">${sectionHead('Meus benefícios','Guardados neste navegador para você explorar.')}<div class="coupon-list">${coins.redeemedRewards.map(r=>`<div class="coupon">${icon('gift')}<div><strong>${esc(r.title||REWARDS.find(x=>x.id===r.rewardId)?.title||'Benefício')}</strong><code>${esc(r.code)}</code><small>Sem validade comercial · demonstração</small></div></div>`).join('')}</div></section>`:''}${notice('Help Coins desta versão são créditos fictícios armazenados no seu navegador. Transferências, doações e benefícios apenas simulam a experiência. Não há compra, saque, conversão, criptomoeda em blockchain ou conexão com a Ripio.')}`;
}
function profile() {
 const state=store.getState();
 return `${heading('SUA HISTÓRIA COMEÇA AQUI','Um perfil. Muitas conexões.','Conte um pouco sobre você e o que gosta de compartilhar.')}<div class="profile-layout"><aside class="profile-card panel"><span class="avatar profile-avatar">${esc(initials(state.profile.name))}</span><span class="tag green">${icon('leaf')} PIONEIRO HELP ALL</span><h2>${esc(state.profile.name)}</h2><p class="muted">${esc(state.profile.bio||'Uma nova pessoa na nossa corrente do bem.')}</p><span class="muted">${icon('pin')} ${esc(state.location.city)}</span><div class="profile-stats"><div><strong>${state.orders.filter(o=>o.status==='concluido').length}</strong><span>helps concluídos</span></div><div><strong>${state.posts.length}</strong><span>publicações</span></div></div><small class="muted">Perfil demonstrativo salvo neste dispositivo.</small></aside><div><form class="panel" id="profile-form"><h2>Como podemos chamar você?</h2><div class="field"><label for="profile-name">Seu nome</label><input id="profile-name" name="name" required minlength="2" maxlength="60" placeholder="Seu nome" value="${state.profile.name==='Visitante'?'':esc(state.profile.name)}" autocomplete="given-name"></div><div class="field"><label for="profile-bio">Um pouco sobre você</label><textarea id="profile-bio" name="bio" maxlength="280" rows="3" placeholder="Talentos, interesses e como você pode ajudar…">${esc(state.profile.bio||'')}</textarea></div><div class="field"><label for="profile-city">Cidade</label><input id="profile-city" name="city" required maxlength="80" value="${esc(state.profile.city||state.location.city)}"></div><p class="muted">Use apenas informações que você se sinta à vontade para testar. Este perfil não cria uma conta real.</p><button class="button primary" type="submit">Salvar meu perfil ${icon('check')}</button></form><div class="panel profile-options"><h3>Seu piloto, do seu jeito</h3><button data-action="feedback">${icon('message')} Compartilhar minha opinião ${icon('chevron')}</button><button data-action="export-data">${icon('download')} Exportar meus dados da demonstração ${icon('chevron')}</button><button data-action="install">${icon('plus')} Como instalar no celular ${icon('chevron')}</button><button data-action="reset">${icon('info')} Reiniciar esta demonstração ${icon('chevron')}</button></div></div></div>`;
}
function impact() {
 const s=store.getState();
 const completed=s.orders.filter(o=>o.status==='concluido').length;
 const donated=(s.donations||[]).reduce((n,d)=>n+d.amount,0);
 const feedback=safeRead('help-all-feedback-v1',[]);
 return `${heading('BOAS CONEXÕES DEIXAM MARCAS','O impacto começa com um help.','Um retrato da sua participação nesta demonstração.')}<div class="info-grid">${[[completed,'helps concluídos','heart'],[s.posts.length,'conexões publicadas','users'],[donated,'HELP em doações simuladas','coin'],[s.coins.ledger.length,'movimentos na carteira','chart']].map(([n,label,i])=>`<div class="info-card">${icon(i)}<strong>${number(n)}</strong><span>${label}</span></div>`).join('')}</div><section class="panel impact-story"><span class="tag green">PILOTO · PRIMEIROS 100</span><h2>Uma comunidade em que ninguém<br>precisa enfrentar tudo sozinho.</h2><p>O HELP ALL nasceu para aproximar necessidades de talentos. Serviços tornam o dia mais fácil. Ajuda voluntária fortalece vínculos. Help Coins reconhecem a participação.</p><div class="intro-stats"><div><strong>01</strong><span>Encontrar quem precisa</span></div><div><strong>02</strong><span>Conectar quem pode ajudar</span></div><div><strong>03</strong><span>Reconhecer cada contribuição</span></div></div>${btn('Fazer parte dessa construção','feedback','','primary')}</section><div class="panel"><h3>O que esta primeira versão nos ajuda a aprender</h3><p class="muted">Quais serviços fazem sentido, como as pessoas encontram ajuda e se as Help Coins tornam a experiência mais interessante. Os números acima são calculados somente com suas ações neste dispositivo, sem representar usuários reais do piloto.</p><p>${Array.isArray(feedback)?feedback.length:0} opinião(ões) registrada(s) neste navegador.</p></div>`;
}
function favorites() {
 const list=SERVICES.filter(s=>store.getState().favorites.includes(s.id));
 return `${heading('GUARDE AS BOAS CONEXÕES','Seus favoritos','Aquele help que você quer encontrar de novo.')}<div class="service-grid">${list.map(card).join('')}</div>${!list.length?empty('Tem muito help para descobrir.','Toque no coração de um serviço para guardá-lo por aqui.',btn('Descobrir possibilidades','navigate','data-route="explore"')):''}`;
}

function navigate(next) {
 if(!routes.includes(next)) return;
 if(route===next){render();window.scrollTo({top:0,behavior:'smooth'});}else location.hash=next;
}
function toast(message) {
 const item=document.createElement('div');item.className='toast';item.innerHTML=`${icon('check')}<span>${esc(message)}</span>`;
 document.querySelector('#toasts').append(item);setTimeout(()=>item.remove(),4500);
}
function result(action, success) {if(!action?.ok){toast(action?.error||'Não foi possível concluir. Tente de novo.');return false;}if(success)toast(success);return true;}
function openModal(title, body, footer='', wide=false) {
 lastFocus=document.activeElement;app.inert=true;document.body.classList.add('modal-open');
 modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="close-button" data-action="close-modal" aria-label="Fechar janela">${icon('x')}</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</section></div>`;
 queueMicrotask(()=>{(modalRoot.querySelector('[autofocus]')||modalRoot.querySelector('.modal')).focus();});
}
function closeModal() {modalRoot.innerHTML='';app.inert=false;document.body.classList.remove('modal-open');if(lastFocus?.isConnected)lastFocus.focus();}
function detail(id) {
 const item=SERVICES.find(s=>s.id===id);if(!item)return;
 openModal('Um help para o seu dia',`<img class="detail-image" src="${esc(item.image)}" alt="${esc(item.title)}"><div class="detail-grid"><div><span class="tag green">${esc(CATEGORIES.find(c=>c.id===item.category)?.label||'Serviço')}</span><h2>${esc(item.title)}</h2><p class="muted">${esc(item.description)}</p></div><span class="detail-price">${item.price?money(item.price):'Voluntário'}<small>${esc(item.unit||'')} · ilustrativo</small></span></div><div class="provider-row"><span class="avatar">${esc(initials(item.provider))}</span><div><strong>${esc(item.provider)}</strong><small>Perfil fictício para demonstração</small></div><span class="rating">${icon('star')} ${item.rating} <small>(${item.reviews})</small></span></div><div class="detail-perks"><span>${icon('clock')} ${esc(item.eta)}</span><span>${icon('pin')} ${number(item.distance)} km</span><span>${icon('coin')} +25 HELP ao concluir</span></div><ul class="detail-list">${(item.details||['Combine os detalhes pelo chat','Acompanhe tudo em Meus pedidos','Experimente sem realizar pagamentos']).map(t=>`<li>${icon('check')} ${esc(t)}</li>`).join('')}</ul>${notice('Você está conhecendo um serviço fictício. A solicitação ficará registrada apenas nesta demonstração.')}`,btn('Solicitar este help '+icon('arrow'),'checkout',`data-id="${item.id}"`,'primary wide'),true);
}
function checkout(id) {
 const item=SERVICES.find(s=>s.id===id);if(!item)return;
 openModal('Vamos conectar esse help?',`<form id="checkout-form"><input type="hidden" name="id" value="${item.id}"><div class="checkout-product"><img src="${esc(item.image)}" alt=""><div><strong>${esc(item.title)}</strong><p class="muted">${esc(item.provider)}</p></div></div><div class="field"><label for="order-note">Conte o que você precisa</label><textarea id="order-note" name="note" rows="3" maxlength="500" placeholder="Detalhes para combinar este help…" autofocus></textarea></div><div class="field-grid"><div class="field"><label for="order-date">Quando?</label><select id="order-date" name="scheduledAt"><option>Assim que possível</option><option>Hoje, à tarde</option><option>Amanhã, pela manhã</option><option>A combinar pelo chat</option></select></div><div class="field"><label for="order-payment">Forma de pagamento (simulada)</label><select id="order-payment" name="payment"><option value="demo">Demonstração · sem cobrança</option><option value="pix-demo">Pix ilustrativo</option><option value="card-demo">Cartão ilustrativo</option></select></div></div><div class="checkout-total"><div class="summary-row"><span>Valor de referência</span><strong>${money(item.price)}</strong></div><div class="summary-row"><span>Taxa nesta demonstração</span><strong>${money(0)}</strong></div><div class="summary-row"><strong>Você não será cobrado</strong><strong>R$ 0,00</strong></div></div><button class="button primary wide" type="submit">Confirmar solicitação simulada ${icon('arrow')}</button><p class="form-disclaimer">Sem cobrança e sem acionamento de prestadores reais.</p></form>`);
}
function chat(id) {
 const s=store.getState(), order=s.orders.find(o=>o.id===id);if(!order)return;
 const messages=s.messages[id]||[];
 openModal(`Conversa com ${esc(order.provider||'a comunidade')}`,`<div class="chat-context">${icon('bag')} ${esc(order.title)} <span class="tag neutral">CHAT SIMULADO</span></div><div class="chat-messages" id="chat-messages">${messages.length?messages.map(m=>`<div class="chat-bubble ${m.role==='user'?'mine':'theirs'}"><small>${esc(m.author||m.role)}</small><p>${esc(m.text)}</p><time>${date(m.date)}</time></div>`).join(''):`<div class="chat-bubble theirs"><small>Assistente de demonstração</small><p>Olá! Este espaço mostra como você poderá combinar os detalhes de um help. Envie uma mensagem para experimentar.</p></div>`}</div><form id="chat-form" class="inline-form"><input type="hidden" name="id" value="${id}"><input aria-label="Sua mensagem" name="text" required maxlength="1000" placeholder="Escreva uma mensagem…" autofocus><button class="button primary" type="submit" aria-label="Enviar mensagem simulada">${icon('send')}</button></form><small class="muted">Respostas automáticas de demonstração. Nenhuma mensagem é enviada a pessoas reais.</small>`);
 queueMicrotask(()=>{const el=document.querySelector('#chat-messages');if(el)el.scrollTop=el.scrollHeight;});
}
function publish(kind='help') {
 openModal('Um help pode começar com você.',`<form id="publish-form"><div class="field"><label for="post-kind">O que vamos compartilhar?</label><select id="post-kind" name="kind"><option value="help" ${kind==='help'?'selected':''}>Preciso de ajuda</option><option value="offer" ${kind==='offer'?'selected':''}>Posso ajudar · oferecer meu talento</option><option value="story" ${kind==='story'?'selected':''}>Uma boa história</option></select></div><div class="field"><label for="post-text">Sua mensagem para a comunidade</label><textarea id="post-text" name="text" required minlength="10" maxlength="1000" rows="5" placeholder="Conte de que precisa ou como pode ajudar. Cada conexão começa com uma conversa." autofocus></textarea></div><div class="field-grid"><div class="field"><label for="post-category">Categoria</label><select id="post-category" name="category"><option value="community">Ajuda comunitária</option>${CATEGORIES.filter(c=>c.id!=='all').map(c=>`<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div><div class="field"><label for="post-reward">HELP propostos (opcional)</label><input id="post-reward" name="reward" type="number" min="0" max="5000" step="1" value="0"></div></div><p class="muted">Os HELP propostos são uma intenção ilustrativa; publicar não movimenta sua carteira. O texto fica neste navegador.</p><button class="button primary wide" type="submit">Publicar na demonstração ${icon('arrow')}</button></form>`);
}
function transfer() {
 openModal('Faça suas coins circularem.',`<form id="transfer-form"><p class="muted">Reconheça alguém da comunidade com uma transferência de Help Coins ilustrativas.</p><div class="field"><label for="coin-recipient">Para quem?</label><select id="coin-recipient" name="recipient"><option value="Ana da comunidade">Ana · comunidade</option><option value="Bruno voluntário">Bruno · voluntário</option><option value="Carla professora">Carla · professora</option></select></div><div class="field"><label for="coin-amount">Quantidade de HELP</label><input id="coin-amount" name="amount" type="number" min="1" max="${store.getState().coins.balance}" step="1" placeholder="50" required autofocus></div><div class="summary-row"><span>Saldo disponível</span><strong>${number(store.getState().coins.balance)} HELP</strong></div>${notice('Destinatários fictícios. O saldo é debitado na sua carteira local; nenhuma outra pessoa recebe valores.')}<button class="button primary wide" type="submit">Revisar transferência ${icon('arrow')}</button></form>`);
}
function donate(id='food') {
 openModal('Um pequeno gesto, um grande help.',`<form id="donate-form"><p class="muted">Experimente apoiar uma causa com Help Coins demonstrativas.</p><div class="field"><label for="donation-cause">Escolha uma causa ilustrativa</label><select name="campaignId" id="donation-cause">${campaigns().map(c=>`<option value="${c.id}" ${c.id===id?'selected':''}>${c.title}</option>`).join('')}</select></div><div class="field"><label for="donation-amount">Quantos HELP você quer doar?</label><input id="donation-amount" name="amount" type="number" min="1" step="1" max="${store.getState().coins.balance}" required placeholder="25" autofocus></div><div class="summary-row"><span>Seu saldo</span><strong>${number(store.getState().coins.balance)} HELP</strong></div>${notice('As campanhas e as doações são fictícias. Não há arrecadação ou entrega de dinheiro a beneficiários.')}<button class="button primary wide" type="submit">Revisar doação ${icon('heart')}</button></form>`);
}
function comments(id) {
 const post=allPosts().find(p=>p.id===id);if(!post)return;
 openModal('A conversa aproxima.',`<p class="post-context">${esc(post.text)}</p><div class="comment-list">${(post.comments||[]).length?(post.comments||[]).map(c=>`<div class="comment"><span class="avatar">${esc(initials(c.author))}</span><div><strong>${esc(c.author)}</strong><p>${esc(c.text)}</p></div></div>`).join(''):'<p class="muted">Seja a primeira pessoa a deixar uma mensagem.</p>'}</div><form id="comment-form" class="inline-form"><input type="hidden" name="id" value="${id}"><input name="text" aria-label="Seu comentário" required maxlength="500" placeholder="Deixe uma palavra de apoio…" autofocus><button class="button primary" type="submit">${icon('send')}</button></form>`);
}
function locationModal() {
 const loc=store.getState().location;
 openModal('Qual é o seu bairro?',`<p class="muted">Uma boa conexão pode estar bem pertinho.</p><form id="cep-form" class="inline-form"><div class="field"><label for="location-cep">Consultar CEP</label><input id="location-cep" name="cep" inputmode="numeric" maxlength="9" pattern="[0-9]{5}-?[0-9]{3}" placeholder="05422-001" aria-describedby="cep-description" required autofocus></div><button class="button secondary" type="submit">Buscar CEP</button></form><p class="muted" id="cep-description">Ao buscar, o CEP informado é enviado ao serviço público ViaCEP para consultar cidade e bairro.</p><div id="cep-result" role="status"></div><form id="location-form"><div class="field"><label for="location-city">Cidade</label><input id="location-city" name="city" required maxlength="80" value="${esc(loc.city)}"></div><div class="field"><label for="location-neighborhood">Bairro</label><input id="location-neighborhood" name="neighborhood" maxlength="80" value="${esc(loc.neighborhood)}"></div><button class="button primary wide" type="submit">Salvar minha região ${icon('pin')}</button></form><small class="muted">O catálogo e o mapa demonstrativos usam Pinheiros, São Paulo. Você também pode preencher a região manualmente.</small>`);
}
function feedback() {
 openModal('Estamos construindo juntos.',`<form id="feedback-form"><p class="muted">Sua primeira impressão ajuda a desenhar os próximos passos do HELP ALL.</p><div class="field"><label for="feedback-rating">Como foi experimentar o app?</label><select name="rating" id="feedback-rating"><option value="5">5 · Quero usar!</option><option value="4">4 · Gostei bastante</option><option value="3">3 · Tem potencial</option><option value="2">2 · Precisa melhorar</option><option value="1">1 · Ainda não fez sentido</option></select></div><div class="field"><label for="feedback-text">O que você mais gostou? O que faltou?</label><textarea name="text" id="feedback-text" required minlength="5" maxlength="1500" rows="5" placeholder="Conte com suas palavras…" autofocus></textarea></div><p class="muted">A opinião será salva neste navegador. Você poderá baixar o registro e entregá-lo à equipe.</p><button type="submit" class="button primary wide">Salvar minha opinião ${icon('heart')}</button></form>`);
}
function about() {
 openModal('HELP ALL. Ajudar conecta.',`<div class="about-logo"><img src="./assets/logo.svg" alt=""><strong>helpall.</strong></div><h3>Uma comunidade em que a ajuda circula.</h3><p>Encontre serviços, peça uma mão amiga, compartilhe o seu talento e experimente uma economia de reconhecimento com Help Coins.</p><div class="about-grid"><span>${icon('heart')} A ajuda vem primeiro</span><span>${icon('users')} Pessoas no centro</span><span>${icon('shield')} Confiança em cada conexão</span><span>${icon('coin')} Boas ações reconhecidas</span></div>${notice('Primeira versão para apresentação aos 100 primeiros convidados. Perfis, ofertas e avaliações do catálogo são fictícios. Seus pedidos, publicações e coins ficam apenas neste navegador. Esta versão não tem contas sincronizadas entre usuários, pagamentos reais ou blockchain.')}<p class="muted">Mapas: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>. Consulta de CEP: <a href="https://viacep.com.br/" target="_blank" rel="noopener noreferrer">ViaCEP</a>. Design e identidade próprios, inspirados na facilidade dos apps do dia a dia.</p>`,btn('Começar a explorar '+icon('arrow'),'close-modal','','primary wide'));
}
function download(name, content, type='application/json') {
 const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function exportLedger() {
 const quote=s=>'"'+String(s??'').replace(/"/g,'""').replace(/^[=+@-]/,"'$&")+'"';
 const state=store.getState();
 const rows=[['id','data','tipo','descricao','HELP'],...state.coins.ledger.map(r=>[r.id,r.date,r.type,r.label,r.amount])];
 download('help-all-extrato-demonstrativo.csv','\uFEFF'+rows.map(r=>r.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8');toast('Seu extrato demonstrativo foi baixado.');
}

document.addEventListener('click',event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();document.querySelector('#main-content').focus();return;}
 const target=event.target.closest('[data-action]');if(!target)return;
 const {action,id}=target.dataset;
 if(action==='navigate'){closeModal();navigate(target.dataset.route);}
 else if(action==='close-modal')closeModal();
 else if(action==='detail')detail(id);
 else if(action==='checkout')checkout(id);
 else if(action==='favorite'){const fav=store.getState().favorites.includes(id);if(result(store.toggleFavorite(id)))toast(fav?'Removido dos favoritos.':'Boa conexão guardada nos favoritos.');}
 else if(action==='category'){category=target.dataset.category;query='';navigate('explore');}
 else if(action==='home-filter'){category=target.dataset.category;render();}
 else if(action==='quick-search'){query=target.dataset.query;category='all';navigate('explore');}
 else if(action==='clear-search'){query='';category='all';topRated=false;render();}
 else if(action==='top-rated'){topRated=!topRated;render();}
 else if(action==='map-select'){selectedMap=id;render();}
 else if(action==='order-tab'){orderTab=target.dataset.tab;render();}
 else if(action==='community-tab'){communityTab=target.dataset.tab;render();}
 else if(action==='advance-order'){const r=store.advanceOrder(id);if(result(r)){toast(r.order?.status==='concluido'?'Help concluído! +25 HELP para sua carteira.':'Próxima etapa simulada com sucesso.');}}
 else if(action==='cancel-order'){openModal('Cancelar esta solicitação?',`<p>O pedido ficará no seu histórico como cancelado. Nenhuma Help Coin será debitada.</p>`,btn('Continuar com meu help','close-modal','','secondary')+btn('Cancelar solicitação','confirm-cancel',`data-id="${id}"`,'danger'));}
 else if(action==='confirm-cancel'){if(result(store.cancelOrder(id),'Solicitação cancelada.'))closeModal();}
 else if(action==='chat')chat(id);
 else if(action==='publish')publish(target.dataset.kind);
 else if(action==='like'){
   if(store.getState().posts.some(p=>p.id===id))result(store.toggleLike(id));
   else{social[id]??={};social[id].liked=!social[id].liked;safeWrite('help-all-social-v1',social);render();}
 }
 else if(action==='comments')comments(id);
 else if(action==='help-post'){
   const p=allPosts().find(p=>p.id===id);if(p)openModal('Seu talento pode fazer a diferença.',`<p><strong>${esc(p.author)}</strong> compartilhou:</p><p class="post-context">${esc(p.text)}</p>${notice('Sua oferta cria uma conexão demonstrativa em Meus pedidos. Nenhuma pessoa real será notificada.')}`,btn('Oferecer este help '+icon('heart'),'confirm-help',`data-id="${id}"`,'primary wide'));
 }
 else if(action==='confirm-help'){
   const p=allPosts().find(p=>p.id===id);if(p){const r=store.createOrder({itemId:p.id,title:'Ajuda comunitária: '+p.text.slice(0,65),category:'community',provider:p.author,price:0,note:'Você se ofereceu para ajudar nesta conexão ilustrativa.',payment:'volunteer-demo'});if(result(r,'Seu help foi registrado. Que boa conexão!')){closeModal();navigate('orders');}}
 }
 else if(action==='claim'){const r=store.claimMission(id);result(r,r.ok?'Recompensa resgatada. Suas coins já estão na carteira.':'');}
 else if(action==='transfer')transfer();
 else if(action==='donate')donate(id);
 else if(action==='redeem'){
   const r=REWARDS.find(r=>r.id===id);if(r)openModal('Uma nova possibilidade para você.',`<div class="success-panel">${icon('gift')}<h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><strong>${r.cost} HELP</strong></div>${notice('Este resgate gera um código de demonstração sem validade comercial e desconta coins do saldo ilustrativo.')}`,btn('Voltar','close-modal','','secondary')+btn('Confirmar resgate','confirm-redeem',`data-id="${id}"`,'primary'));
 }
 else if(action==='confirm-redeem'){
   const r=store.redeemReward(id);if(result(r)){openModal('Seu benefício está aqui!',`<div class="success-panel">${icon('gift')}<h3>${esc(r.redemption?.title||r.reward?.title||'Benefício resgatado')}</h3><p>Seu código ilustrativo</p><code class="coupon-code">${esc(r.redemption?.code||r.code||'DEMO-HELP')}</code><p class="muted">Ele também está salvo em “Meus benefícios”. Sem validade comercial.</p></div>`,btn('Voltar para a carteira','close-modal','','primary wide'));}
 }
 else if(action==='location')locationModal();
 else if(action==='feedback')feedback();
 else if(action==='about')about();
 else if(action==='notifications'){
  const s=store.getState();openModal('Suas boas conexões',`<div class="notification-item">${icon('gift')}<div><strong>250 HELP para conhecer a experiência</strong><p class="muted">Seu saldo inicial ilustrativo já está disponível.</p></div></div><div class="notification-item">${icon('users')}<div><strong>Você está no começo dessa história</strong><p class="muted">Experimente o app e compartilhe sua opinião sobre a primeira versão.</p></div></div>${s.orders.length?`<div class="notification-item">${icon('bag')}<div><strong>${s.orders.length} pedido(s) na sua demonstração</strong><p class="muted">Acompanhe as etapas em Meus pedidos.</p></div></div>`:''}`,btn('Ver minhas coins','navigate','data-route="wallet"','primary wide'));
 }
 else if(action==='export-ledger')exportLedger();
 else if(action==='export-data'){download('help-all-minha-demonstracao.json',JSON.stringify({app:'HELP ALL',version:'0.1',mode:'demonstration',exportedAt:new Date().toISOString(),data:store.getState(),feedback:safeRead('help-all-feedback-v1',[]),ratings:safeRead('help-all-ratings-v1',{}),social},null,2));toast('Seus dados da demonstração foram baixados.');}
 else if(action==='download-feedback'){download('help-all-opinioes.json',JSON.stringify(safeRead('help-all-feedback-v1',[]),null,2));}
 else if(action==='install'){openModal('O HELP ALL mais perto de você.',`<p>No celular, abra o link do app no navegador.</p><ol class="install-list"><li><strong>Android:</strong> toque no menu do Chrome e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</li><li><strong>iPhone:</strong> no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</li><li><strong>Computador:</strong> procure o botão de instalação na barra de endereço, se disponível.</li></ol><p class="muted">A disponibilidade depende do navegador e de o app estar aberto em um endereço HTTPS ou localhost. Esta é uma experiência web, sem publicação em lojas.</p>`,btn('Entendi','close-modal','','primary wide'));}
 else if(action==='rate'){
   openModal('Como foi esse help?',`<form id="rate-form"><input type="hidden" name="id" value="${id}"><p class="muted">A avaliação fica no registro da demonstração.</p><div class="field"><label for="help-stars">Sua avaliação</label><select id="help-stars" name="rating"><option value="5">★★★★★ · Excelente</option><option value="4">★★★★☆ · Muito bom</option><option value="3">★★★☆☆ · Bom</option><option value="2">★★☆☆☆ · Pode melhorar</option><option value="1">★☆☆☆☆ · Precisa melhorar</option></select></div><div class="field"><label for="help-review">Um comentário</label><textarea id="help-review" name="text" rows="3" maxlength="500" placeholder="Conte sua experiência…"></textarea></div><button class="button primary wide" type="submit">Salvar avaliação ${icon('star')}</button></form>`);
   const saved=safeRead('help-all-ratings-v1',{})?.[id];
   if(saved){modalRoot.querySelector('#help-stars').value=String(saved.rating);modalRoot.querySelector('#help-review').value=String(saved.text||'');}
 }
 else if(action==='reset'){openModal('Começar a demonstração de novo?',`<p>Isso reinicia perfil, pedidos, publicações, favoritos, opiniões e Help Coins deste navegador. Você começa novamente com 250 HELP.</p><p class="muted">Você pode exportar seus dados no perfil antes de reiniciar.</p>`,btn('Manter meus dados','close-modal','','secondary')+btn('Reiniciar demonstração','confirm-reset','','danger'));}
 else if(action==='confirm-reset'){store.resetDemo();social={};safeWrite('help-all-social-v1',{});safeWrite('help-all-feedback-v1',[]);safeWrite('help-all-ratings-v1',{});closeModal();query='';category='all';navigate('home');toast('Tudo pronto para novas conexões.');}
 else if(action==='confirm-transfer'){
   const r=store.transferCoins({recipient:target.dataset.recipient,amount:Number(target.dataset.amount)});if(result(r,'Transferência ilustrativa registrada no extrato.'))closeModal();
 }
 else if(action==='confirm-donation'){
   const r=store.donateCoins({campaignId:id,amount:Number(target.dataset.amount)});if(result(r,'Sua doação ilustrativa foi registrada. Obrigado por esse help!'))closeModal();
 }
});

document.addEventListener('submit',async event=>{
 const form=event.target;const formId=form.getAttribute('id');if(!formId)return;event.preventDefault();
 const data=Object.fromEntries(new FormData(form));
 if(formId==='search-form'){query=String(data.query||'').trim();category='all';navigate('explore');}
 else if(formId==='checkout-form'){
   const item=SERVICES.find(s=>s.id===data.id);if(!item)return;
   const r=store.createOrder({itemId:item.id,title:item.title,price:item.price,category:item.category,provider:item.provider,note:data.note,scheduledAt:data.scheduledAt,payment:data.payment});
   if(result(r,'Seu pedido demonstrativo está pronto para acompanhar.')){closeModal();navigate('orders');}
 }
 else if(formId==='profile-form'){if(result(store.updateProfile(data),'Seu perfil já está com a sua cara.')){store.setLocation({...store.getState().location,city:data.city});render();}}
 else if(formId==='publish-form'){if(result(store.addPost({...data,reward:Number(data.reward)}),'Seu help já está na comunidade desta demonstração.')){closeModal();communityTab='all';navigate('community');}}
 else if(formId==='chat-form'){if(result(store.sendMessage(data.id,data.text))){chat(data.id);}}
 else if(formId==='comment-form'){
   if(store.getState().posts.some(p=>p.id===data.id)){if(!result(store.addComment(data.id,data.text)))return;}
   else{social[data.id]??={};social[data.id].comments??=[];social[data.id].comments.push({id:crypto.randomUUID(),author:store.getState().profile.name,text:String(data.text).trim(),date:new Date().toISOString()});safeWrite('help-all-social-v1',social);render();}
   comments(data.id);
 }
 else if(formId==='transfer-form'){
   const amount=Number(data.amount);if(!Number.isSafeInteger(amount)||amount<=0||amount>store.getState().coins.balance){toast('Informe uma quantidade inteira dentro do seu saldo.');return;}
   openModal('Vamos conferir a transferência?',`<div class="success-panel">${icon('send')}<h3>${number(amount)} HELP</h3><p>Para ${esc(data.recipient)}</p><span class="tag neutral">TRANSFERÊNCIA ILUSTRATIVA</span></div><p class="muted">Seu saldo ficará em ${number(store.getState().coins.balance-amount)} HELP. Nenhum destinatário real receberá valores.</p>`,btn('Voltar','transfer','','secondary')+btn('Confirmar transferência','confirm-transfer',`data-recipient="${esc(data.recipient)}" data-amount="${amount}"`,'primary'));
 }
 else if(formId==='donate-form'){
   const amount=Number(data.amount), campaign=campaigns().find(c=>c.id===data.campaignId);if(!campaign||!Number.isSafeInteger(amount)||amount<=0||amount>store.getState().coins.balance){toast('Informe uma quantidade inteira dentro do seu saldo.');return;}
   openModal('Confirme esse gesto de apoio.',`<div class="success-panel">${icon('heart')}<h3>${number(amount)} HELP</h3><p>${esc(campaign.title)}</p><span class="tag neutral">DOAÇÃO ILUSTRATIVA</span></div><p class="muted">As coins serão descontadas do seu saldo local. Nenhuma campanha real receberá valores.</p>`,btn('Voltar','donate',`data-id="${campaign.id}"`,'secondary')+btn('Confirmar doação','confirm-donation',`data-id="${campaign.id}" data-amount="${amount}"`,'primary'));
 }
 else if(formId==='cep-form'){
   const cep=String(data.cep).replace(/\D/g,'');if(!/^\d{8}$/.test(cep)){toast('Informe um CEP com 8 números.');return;}
   const button=form.querySelector('button'), output=document.querySelector('#cep-result');button.disabled=true;button.textContent='Consultando…';output.textContent='Consultando o ViaCEP…';
   try{const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error();const address=await response.json();if(address.erro){output.textContent='CEP não encontrado. Confira ou preencha manualmente.';return;}if(!form.isConnected)return;document.querySelector('#location-city').value=address.localidade||'';document.querySelector('#location-neighborhood').value=address.bairro||'';document.querySelector('#location-form').dataset.cep=cep;output.textContent=`Encontramos ${address.bairro?address.bairro+', ':''}${address.localidade} / ${address.uf}. Confira e salve sua região.`;}catch{if(output.isConnected)output.textContent='Não foi possível consultar agora. Você pode preencher cidade e bairro manualmente.';}finally{if(button.isConnected){button.disabled=false;button.textContent='Buscar CEP';}}
 }
 else if(formId==='location-form'){
   const previous=store.getState().location;const r=store.setLocation({...previous,...data,cep:form.dataset.cep||previous.cep});if(result(r,'Região salva para a sua demonstração.'))closeModal();
 }
 else if(formId==='feedback-form'){
   let saved=safeRead('help-all-feedback-v1',[]);if(!Array.isArray(saved))saved=[];saved.push({rating:Number(data.rating),text:String(data.text).trim(),date:new Date().toISOString(),version:'0.1',mode:'local-demo'});if(!safeWrite('help-all-feedback-v1',saved))return;
   openModal('Seu help faz a diferença.',`<div class="success-panel">${icon('heart')}<h3>Opinião salva. Obrigado!</h3><p>A primeira versão fica melhor com a sua participação.</p><p class="muted">Este registro está neste navegador. Baixe o arquivo para compartilhar com a equipe do HELP ALL.</p></div>`,btn(`${icon('download')} Baixar minha opinião`,'download-feedback','','secondary')+btn('Continuar explorando','close-modal','','primary'));render();
 }
 else if(formId==='rate-form'){
   let ratings=safeRead('help-all-ratings-v1',{});if(!ratings||typeof ratings!=='object'||Array.isArray(ratings))ratings={};ratings[data.id]={rating:Number(data.rating),text:data.text,date:new Date().toISOString()};if(!safeWrite('help-all-ratings-v1',ratings))return;closeModal();toast('Sua avaliação demonstrativa foi salva.');
 }
});
document.addEventListener('change',event=>{if(event.target.id==='sort-select'){sort=event.target.value;render();}});
document.addEventListener('keydown',event=>{
 if(!modalRoot.firstChild)return;
 if(event.key==='Escape'){event.preventDefault();closeModal();}
 if(event.key==='Tab'){
  const items=[...modalRoot.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&!el.hidden);
  if(!items.length)return;const first=items[0],last=items.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===modalRoot.querySelector('.modal'))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
window.addEventListener('hashchange',()=>{closeModal();const next=location.hash.slice(1);route=routes.includes(next)?next:'home';render();window.scrollTo(0,0);});
window.addEventListener('offline',()=>toast('Você está offline. A demonstração local continua disponível.'));
store.subscribe(render);
render();
const persistence=store.getPersistenceStatus();
if(!persistence.available)toast('Este navegador não permite salvar dados. A demonstração funciona enquanto esta página estiver aberta.');
else if(persistence.recovered)toast('Os dados locais estavam incompletos. Iniciamos uma nova demonstração.');
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
