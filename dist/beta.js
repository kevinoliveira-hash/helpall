/** Entrada do beta de apresentação. Não cria conta Auth nem envia dados ao servidor.
 * O perfil usa exclusivamente o store demonstrativo já existente no navegador.
 */
export function renderBeta({ root, profile, onEnter, onGuest }) {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const returning = profile.name && profile.name !== 'Visitante';
  root.innerHTML = `<div class="auth-shell beta-shell">
    <aside class="auth-brand">
      <a class="auth-logo" href="#beta"><img src="./assets/help-brand.svg" alt=""><span>Help <b>All</b><small>JUNTOS POR UM MUNDO MELHOR</small></span></a>
      <span class="auth-edition"><i></i> BETA · PRIMEIROS 100 CONVIDADOS</span>
      <h1>Um pequeno help.<br>Um mundo de <em>possibilidades.</em></h1>
      <p class="auth-brand-description">Encontre ajuda perto de você, compartilhe seu talento e descubra como boas ações podem circular.</p>
      <div class="auth-coin-scene"><div class="auth-orbit orbit-one"></div><img class="auth-coin-art" src="./assets/help-coin.svg" alt="HelpCoin, símbolo de reconhecimento da comunidade"><span class="floating-chip chip-bottom">HelpCoins ilustrativas para experimentar</span></div>
      <div class="auth-values"><span>Ajuda no bairro</span><span>Comunidade</span><span>Recompensas</span></div>
      <div class="auth-brand-footer"><span>CONSTRUÍDO COM QUEM CHEGA PRIMEIRO</span><span>Juntos, podemos.</span></div>
    </aside>
    <main class="auth-main"><div class="auth-topline"><span>VOCÊ FAZ PARTE DO COMEÇO</span><span class="beta-pill">VERSÃO DE APRESENTAÇÃO</span></div>
      <section class="auth-card"><span class="auth-overline">CADASTRO BETA DE DEMONSTRAÇÃO</span>
        <h2>${returning ? 'Que bom ver você de novo.' : 'Seu primeiro help começa aqui.'}</h2>
        <p class="auth-subtitle">${returning ? 'Continue explorando com seu perfil de teste neste navegador.' : 'Crie seu perfil de teste e conheça o HELP ALL em poucos segundos.'}</p>
        <div class="beta-summary"><span>01 · Crie seu perfil</span><span>02 · Explore o app</span><span>03 · Conte sua experiência</span></div>
        <form id="beta-form">
          <label for="beta-name">Como podemos chamar você?</label><input id="beta-name" name="name" autocomplete="given-name" minlength="2" maxlength="60" placeholder="Seu nome ou apelido" value="${returning ? escape(profile.name) : ''}" required>
          <label for="beta-city">Sua cidade</label><input id="beta-city" name="city" autocomplete="address-level2" minlength="2" maxlength="80" placeholder="Ex.: São Paulo" value="${escape(profile.city || 'São Paulo')}" required>
          <label class="beta-consent"><input type="checkbox" name="consent" required><span>Entendo que estou testando uma demonstração. Meu perfil fica neste navegador e as HelpCoins não têm valor monetário.</span></label>
          <p id="beta-error" role="alert" class="auth-status"></p>
          <button class="auth-submit" type="submit">${returning ? 'Continuar no beta' : 'Criar perfil e experimentar'} <span aria-hidden="true">→</span></button>
        </form>
        <button class="auth-demo" type="button" id="beta-guest">Só dar uma olhada, sem cadastro →</button>
        <div class="auth-reassurance"><span>Sem senha, pagamento ou documento.<br>O cadastro beta não reserva uma vaga nem sincroniza dados entre dispositivos.</span></div>
      </section><footer class="auth-footer"><span>Uma comunidade. Muitas possibilidades.</span><span>Versão de apresentação · 0.2 beta</span></footer>
    </main></div>`;
  root.onclick = event => {
    if (event.target.closest('#beta-guest')) {
      root.onclick = root.onsubmit = null;
      onGuest();
    }
  };
  root.onsubmit = event => {
    if (event.target.id !== 'beta-form') return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (!values.name.trim() || values.name.trim().length < 2 || values.city.trim().length < 2) {
      const error = root.querySelector('#beta-error');
      error.textContent = 'Preencha seu nome e cidade com pelo menos 2 caracteres.';
      error.className = 'auth-status is-visible is-error';
      return;
    }
    root.onclick = root.onsubmit = null;
    onEnter({name: values.name.trim(), city: values.city.trim()});
  };
}

