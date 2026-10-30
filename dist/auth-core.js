/** Funções puras de segurança, compartilhadas com os testes. */
export function validatePublicConfig(config) {
  if (!config?.url || !config?.publishableKey)
    return { ok: false, reason: "missing" };
  try {
    const url = new URL(config.url);
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !["", "/"].includes(url.pathname)
    )
      return { ok: false, reason: "url" };
    const key = config.publishableKey;
    if (typeof key !== "string" || key.startsWith("sb_secret_"))
      return { ok: false, reason: "secret" };
    if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return { ok: true };
    const parts = key.split(".");
    if (parts.length !== 3) return { ok: false, reason: "key" };
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.role === "anon"
      ? { ok: true }
      : { ok: false, reason: "secret" };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
/**
 * Tokens de acesso/renovação ficam SOMENTE em memória, não no localStorage.
 * Apenas o verificador PKCE temporário sobrevive à navegação para o Google.
 * Ao recarregar, o usuário precisará entrar novamente. Isso é intencional.
 * CSP e RLS continuam obrigatórias: nenhum armazenamento de navegador elimina XSS.
 */
export function createSessionStorage(pkceStorage) {
  const memory = new Map();
  const isVerifier = (key) => key.endsWith("-code-verifier");
  return {
    getItem(key) {
      if (isVerifier(key)) {
        try {
          return pkceStorage?.getItem(key) ?? null;
        } catch {
          return null;
        }
      }
      return memory.get(key) ?? null;
    },
    setItem(key, value) {
      if (isVerifier(key)) {
        if (!pkceStorage)
          throw new Error("PKCE precisa de armazenamento temporário.");
        pkceStorage.setItem(key, value);
      } else memory.set(key, value);
    },
    removeItem(key) {
      memory.delete(key);
      if (isVerifier(key)) {
        try {
          pkceStorage?.removeItem(key);
        } catch {}
      }
    },
    clear() {
      memory.clear();
    },
  };
}
export function validateSignup({
  name,
  email,
  password,
  confirmation,
  consent,
}) {
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 60
  )
    return "Informe seu nome, de 2 a 60 caracteres.";
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return "Informe um e-mail válido.";
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    return "Use uma senha entre 12 e 128 caracteres.";
  if (password !== confirmation) return "As senhas precisam ser iguais.";
  if (!consent)
    return "Leia e confirme as informações sobre o piloto e privacidade.";
  return null;
}
export function authError(error) {
  if (["invalid_credentials", "invalid_grant"].includes(error?.code))
    return "Não foi possível entrar. Confira os dados ou recupere o acesso.";
  if (
    error?.status === 429 ||
    ["over_email_send_rate_limit", "over_request_rate_limit"].includes(
      error?.code,
    )
  )
    return "Muitas tentativas. Aguarde um pouco antes de tentar novamente.";
  if (error?.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar. Confira também a caixa de spam.";
  if (error?.code === "weak_password")
    return "Escolha uma senha mais longa e exclusiva para o HELP ALL.";
  if (
    /captcha/i.test(error?.code || "") ||
    /captcha/i.test(error?.message || "")
  )
    return "A proteção contra robôs requer configuração. Fale com a equipe do piloto.";
  return "Não foi possível concluir agora. Tente novamente em instantes.";
}

/** Coalesce duplo clique e preserva o nonce quando a resposta de rede é incerta. */
export function createIdempotentAction(makeId = () => crypto.randomUUID()) {
  const pending = new Map(),
    nonces = new Map();
  return function run(kind, payload, execute) {
    const key = JSON.stringify([kind, payload]);
    if (pending.has(key)) return pending.get(key);
    const nonce = nonces.get(key) || makeId();
    nonces.set(key, nonce);
    const task = Promise.resolve()
      .then(() => execute(nonce))
      .then((result) => {
        if (result?.ok) nonces.delete(key);
        return result;
      })
      .finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}
