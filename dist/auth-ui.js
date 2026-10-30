import { icon } from "./icons.js";
import {
  ShieldCheck,
  Fingerprint,
  HeartHandshake,
  ArrowUpRight,
  LockKeyhole,
  Users,
  Coins,
} from "./vendor/lucide.js";
const e = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Ícones Lucide são distribuídos localmente; não há script externo de interface.
function lineIcon(nodes) {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodes
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${e(value)}"`)
          .join(" ")}></${tag}>`,
    )
    .join("")}</svg>`;
}
const googleMark =
  '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c2-1.8 2.9-4.3 2.9-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4L15.4 17c-.9.6-2 1-3.4 1a6 6 0 0 1-5.7-4.2H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.3 13.8a6 6 0 0 1 0-3.6V7.6H3a10 10 0 0 0 0 8.8l3.3-2.6Z"/><path fill="#EA4335" d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.6l3.3 2.6A6 6 0 0 1 12 6Z"/></svg>';
let view = "login",
  factorId = null,
  qr = null;
export function renderAuth({
  root,
  auth,
  onSignedIn,
  onDemo,
  mode,
  message,
  pending = false,
}) {
  if (mode) view = mode;
  const signup = view === "signup",
    recovery = view === "recover",
    update = view === "update",
    security = view === "security";
  const title = pending
    ? "Você já faz parte do começo."
    : security
      ? "Uma camada a mais de cuidado."
      : signup
        ? "Seu primeiro help começa aqui."
        : recovery
          ? "Vamos recuperar seu acesso."
          : update
            ? "Uma nova senha para continuar."
            : "Que bom ter você por aqui.";
  const subtitle = pending
    ? "Sua conta está confirmada. A equipe precisa liberar sua participação no piloto."
    : security
      ? "Proteja sua conta com um aplicativo autenticador."
      : signup
        ? "Crie sua conta e conecte seu talento a quem precisa."
        : recovery
          ? "Enviaremos as instruções para o seu e-mail."
          : update
            ? "Escolha uma senha longa e exclusiva para o HELP ALL."
            : "Entre para encontrar ajuda, compartilhar seu talento e fazer parte dessa rede.";
  root.innerHTML = `<div class="auth-shell"><aside class="auth-brand"><a class="auth-logo" href="#login"><img src="./assets/help-brand.svg" alt=""><span>Help <b>All</b><small>JUNTOS POR UM MUNDO MELHOR</small></span></a><span class="auth-edition"><i></i> UMA COMUNIDADE EM CONSTRUÇÃO</span><h1>Mais que uma conta.<br>Uma rede de <em>ajuda.</em></h1><p class="auth-brand-description">Conectamos pessoas que precisam de ajuda com quem pode ajudar. Seu próximo gesto pode transformar um dia.</p><div class="auth-coin-scene"><div class="auth-orbit orbit-one"></div><div class="auth-orbit orbit-two"></div><img class="auth-coin-art" src="./assets/help-coin.svg" alt="HelpCoin, um símbolo de solidariedade e reconhecimento"><span class="floating-chip chip-top">${lineIcon(HeartHandshake)} Pequenos helps. Grandes mudanças.</span><span class="floating-chip chip-bottom">${lineIcon(Coins)} Solidariedade que gera valor</span></div><div class="auth-values"><span>${lineIcon(Users)} Comunidade</span><span>${lineIcon(ShieldCheck)} Transparência</span><span>${lineIcon(HeartHandshake)} Propósito</span></div><div class="auth-brand-footer"><span>HELP ALL · PILOTO BRASIL</span><span>Juntos, podemos. ${icon("arrow")}</span></div></aside><main class="auth-main"><div class="auth-topline"><span>${lineIcon(ShieldCheck)} ACESSO À COMUNIDADE</span><a href="#${signup ? "login" : "signup"}" data-auth="${signup ? "login" : "signup"}">${signup ? "Já tenho conta" : "Quero fazer parte"} ${icon("arrow")}</a></div><section class="auth-card"><div class="auth-card-icon">${lineIcon(security ? Fingerprint : pending ? HeartHandshake : LockKeyhole)}</div><span class="auth-overline">${signup ? "COMECE UMA BOA CONEXÃO" : pending ? "PRIMEIROS 100" : security ? "SEGURANÇA DA CONTA" : "BEM-VINDO AO HELP ALL"}</span><h2>${title}</h2><p class="auth-subtitle">${subtitle}</p><div id="auth-status" class="auth-status ${message ? "is-visible" : ""}" role="status">${e(message || "")}</div>
  ${pending ? `<div class="auth-pending">${lineIcon(ShieldCheck)}<p>Você pode explorar a demonstração enquanto aguarda. Ela fica separada dos dados da sua conta.</p></div><button class="auth-submit" data-auth="demo">Explorar demonstração ${icon("arrow")}</button><button class="auth-secondary" data-auth="signout">Sair da conta</button>` : security ? securityContent() : `${!recovery && !update ? `<button class="google-button" data-auth="google" ${!auth.googleEnabled ? 'disabled aria-describedby="auth-config-note"' : ""}>${googleMark} Continuar com o Google</button><div class="auth-divider"><span>ou continue com seu e-mail</span></div>` : ""}<form id="auth-form" novalidate><input type="hidden" name="mode" value="${view}">${signup ? `<label for="auth-name">Como podemos chamar você?</label><input id="auth-name" name="name" autocomplete="given-name" maxlength="60" placeholder="Seu nome" required>` : ""}${!update ? `<label for="auth-email">Seu e-mail</label><div class="auth-input-wrap">${icon("message")}<input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="voce@exemplo.com" required></div>` : ""}${!recovery ? `<div class="auth-password-label"><label for="auth-password">${update ? "Nova senha" : "Sua senha"}</label>${!signup && !update ? '<a href="#recover" data-auth="recover">Esqueci minha senha</a>' : ""}</div><div class="auth-input-wrap">${icon("shield")}<input id="auth-password" name="password" type="password" autocomplete="${signup || update ? "new-password" : "current-password"}" minlength="${signup || update ? 12 : 1}" maxlength="128" placeholder="${signup || update ? "No mínimo 12 caracteres" : "Sua senha"}" required><button type="button" data-auth="show-password" aria-label="Mostrar senha">${icon("user")}</button></div>${signup || update ? `<label for="auth-confirmation">Confirme sua senha</label><input id="auth-confirmation" name="confirmation" type="password" autocomplete="new-password" maxlength="128" placeholder="Repita a mesma senha" required>` : ""}` : ""}${signup ? `<label class="auth-consent"><input type="checkbox" name="consent" required><span>Li as <button type="button" data-auth="privacy">informações do piloto e privacidade</button>. Entendo que as Help Coins são créditos ilustrativos, sem valor monetário.</span></label>` : ""}<button class="auth-submit" type="submit" ${!auth.configured ? "disabled" : ""}>${signup ? "Criar minha conta" : recovery ? "Enviar instruções" : update ? "Salvar nova senha" : "Entrar na minha conta"} ${icon("arrow")}</button></form>${!auth.configured ? `<p class="auth-config-note" id="auth-config-note">A abertura de contas está sendo preparada. Enquanto isso, conheça a experiência na demonstração.</p>` : ""}<p class="auth-switch">${signup ? "Já faz parte da comunidade?" : recovery || update ? "Lembrou seu acesso?" : "Primeiro help por aqui?"} <a href="#${signup || recovery || update ? "login" : "signup"}" data-auth="${signup || recovery || update ? "login" : "signup"}">${signup || recovery || update ? "Entrar na conta" : "Criar uma conta"}</a></p><button class="auth-demo" data-auth="demo">Conhecer o app sem entrar ${icon("arrow")}</button>`}
  <div class="auth-reassurance">${lineIcon(ShieldCheck)}<span>Seus dados privados ficam vinculados à sua conta.<br>Você escolhe o que compartilha com a comunidade.</span></div></section><footer class="auth-footer"><span>Uma comunidade. Muitas possibilidades.</span><button data-auth="privacy">Piloto e privacidade</button></footer></main></div>`;
  // OAuth só aparece como disponível depois da configuração real no Google Cloud.
  const googleButton = root.querySelector('.google-button');
  if (googleButton && !auth.googleEnabled) {
    googleButton.insertAdjacentHTML('afterend', '<p class="auth-config-note" id="auth-config-note">Acesso com Google em preparação. Por enquanto, use seu e-mail ou explore a demonstração.</p>');
  }
  root.onclick = async (event) => {
    const el = event.target.closest("[data-auth]");
    if (!el) return;
    event.preventDefault();
    const action = el.dataset.auth;
    if (["login", "signup", "recover"].includes(action)) {
      factorId = null;
      qr = null;
      view = action;
      renderAuth({ root, auth, onSignedIn, onDemo });
      return;
    }
    if (action === "demo") {
      root.onclick = null;
      root.onsubmit = null;
      onDemo();
      return;
    }
    if (action === "show-password") {
      const field = root.querySelector("#auth-password");
      field.type = field.type === "password" ? "text" : "password";
      el.setAttribute(
        "aria-label",
        field.type === "password" ? "Mostrar senha" : "Ocultar senha",
      );
      return;
    }
    if (action === "privacy") {
      showStatus(
        "HELP ALL está em piloto. O cadastro usa Supabase Auth para autenticar você. Não publique telefone, endereço completo, documentos ou informações sensíveis nos pedidos. As Help Coins não são investimento nem permitem saque. No modo demonstração, os dados ficam no navegador; na conta conectada, ficam no projeto Supabase do HELP ALL. A equipe precisa publicar os termos definitivos e um canal de privacidade antes de abrir o cadastro ao público.",
      );
      return;
    }
    try {
      if (action === "google") {
        el.disabled = true;
        await auth.google();
      }
      if (action === "signout") {
        await auth.signOut();
        onSignedIn(null);
      }
      if (action === "enroll") {
        const data = await auth.enroll();
        factorId = data.id;
        qr = data.totp.qr_code;
        renderAuth({ root, auth, onSignedIn, onDemo, mode: "security" });
      }
      if (action === "verify-existing") {
        const list = await auth.factors();
        factorId = list.totp.find((f) => f.status === "verified")?.id;
        qr = null;
        if (!factorId) throw new Error("Configure um autenticador primeiro.");
        renderAuth({ root, auth, onSignedIn, onDemo, mode: "security" });
      }
    } catch (error) {
      showStatus(error.message, true);
      el.disabled = false;
    }
  };
  root.onsubmit = async (event) => {
    if (
      !["auth-form", "auth-mfa-form"].includes(event.target.getAttribute("id"))
    )
      return;
    event.preventDefault();
    const form = event.target,
      data = Object.fromEntries(new FormData(form));
    if (!form.reportValidity()) return;
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      if (form.getAttribute("id") === "auth-mfa-form") {
        await auth.verify(factorId, String(data.code));
        factorId = null;
        qr = null;
        root.onclick = null;
        root.onsubmit = null;
        await onSignedIn(
          auth.user || (await auth.client.auth.getUser()).data.user,
        );
        return;
      }
      if (data.mode === "login") {
        const user = await auth.login(data);
        form.reset();
        root.onclick = null;
        root.onsubmit = null;
        await onSignedIn(user);
        return;
      }
      if (data.mode === "signup") {
        const text = await auth.signup({
          ...data,
          consent: data.consent === "on",
        });
        form.reset();
        showStatus(text);
      }
      if (data.mode === "recover") {
        showStatus(await auth.recover(data.email));
        form.reset();
      }
      if (data.mode === "update") {
        showStatus(await auth.updatePassword(data.password, data.confirmation));
        form.reset();
      }
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
  };
  // Mantém o foco na própria página; não registra senhas nem códigos em logs.
  function showStatus(text, error = false) {
    const node = root.querySelector("#auth-status");
    if (node) {
      node.textContent = text;
      node.className = "auth-status is-visible " + (error ? "is-error" : "");
      node.setAttribute("role", error ? "alert" : "status");
    }
  }
  function securityContent() {
    return `<div class="auth-security-note">Movimentações de HELP na conta conectada exigem um segundo fator. Use um autenticador TOTP de sua preferência.</div>${factorId ? `${qr ? `<img class="mfa-qr" src="${e(qr)}" alt="QR Code para cadastrar HELP ALL no seu autenticador">` : ""}<form id="auth-mfa-form"><label for="auth-code">Código do autenticador</label><input id="auth-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="000000"><button type="submit" class="auth-submit">Confirmar proteção ${icon("check")}</button></form>` : `<button class="auth-submit" data-auth="enroll">Configurar autenticador ${icon("shield")}</button><button class="auth-secondary" data-auth="verify-existing">Já tenho um autenticador</button>`}<button class="auth-demo" data-auth="demo">Voltar à demonstração ${icon("arrow")}</button>`;
  }
}
