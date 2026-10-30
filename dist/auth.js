import { SUPABASE_CONFIG } from "./config.js";
import {
  validatePublicConfig,
  createSessionStorage,
  validateSignup,
  authError,
} from "./auth-core.js";

/** Cliente oficial Supabase. Chave pública + JWT do usuário + RLS, sem service_role. */
export async function createAuthSystem() {
  const configured = validatePublicConfig(SUPABASE_CONFIG).ok;
  let client = null,
    user = null,
    initialMode = "login",
    error = null;
  if (configured) {
    const { createClient } = await import("./vendor/supabase.js");
    let temporary;
    try {
      temporary = sessionStorage;
    } catch {}
    client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        storage: createSessionStorage(temporary),
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    // O código de uso único só é trocado quando há um verificador PKCE válido.
    const callback = new URL(location.href),
      code = callback.searchParams.get("code");
    if (code) {
      initialMode =
        callback.searchParams.get("flow") === "recovery" ? "update" : "login";
      const response = await client.auth.exchangeCodeForSession(code);
      if (response.error)
        error =
          "Este link expirou ou foi aberto em outro navegador. Solicite um novo link.";
      // Remove códigos e erros da barra de endereço e do histórico visível.
      history.replaceState(null, "", location.pathname + location.hash);
    }
    if (callback.searchParams.has("error")) {
      error = "Não foi possível concluir o acesso externo. Tente novamente.";
      history.replaceState(null, "", location.pathname);
    }
    const response = await client.auth.getUser();
    user = response.data?.user || null;
  }
  const redirect = (flow) =>
    location.origin + location.pathname + (flow ? `?flow=${flow}` : "");
  const requireClient = () => {
    if (!client)
      throw new Error(
        "A abertura de contas ainda está sendo preparada. Você pode explorar a demonstração.",
      );
    return client;
  };
  return {
    client,
    configured,
    googleEnabled: configured && SUPABASE_CONFIG.googleEnabled,
    user,
    initialMode,
    error,
    async login({ email, password }) {
      const { data, error } = await requireClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(authError(error));
      // getUser verifica a sessão junto ao Auth; dados locais nunca autorizam acesso.
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data.user)
        throw new Error("Não foi possível verificar a sessão.");
      return verified.data.user;
    },
    async signup(input) {
      const invalid = validateSignup(input);
      if (invalid) throw new Error(invalid);
      const { error } = await requireClient().auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: { display_name: input.name.trim() },
          emailRedirectTo: redirect(),
        },
      });
      if (error) throw new Error(authError(error));
      return "Confira seu e-mail. Se o cadastro puder ser realizado, você receberá um link para confirmar o acesso. Depois, a equipe libera sua participação no piloto.";
    },
    async google() {
      if (!this.googleEnabled)
        throw new Error(
          "O acesso com Google será liberado após a configuração do piloto.",
        );
      const { error } = await requireClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirect(),
          scopes: "openid email profile",
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw new Error(authError(error));
    },
    async recover(email) {
      const { error } = await requireClient().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirect("recovery") },
      );
      if (error) throw new Error(authError(error));
      return "Se houver uma conta elegível para este e-mail, enviaremos as instruções de recuperação.";
    },
    async updatePassword(password, confirmation) {
      if (
        password.length < 12 ||
        password.length > 128 ||
        password !== confirmation
      )
        throw new Error("Use de 12 a 128 caracteres e confirme a mesma senha.");
      const { error } = await requireClient().auth.updateUser({ password });
      if (error) throw new Error(authError(error));
      return "Senha atualizada. Use sua nova senha no próximo acesso.";
    },
    async signOut() {
      if (client) {
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw new Error("Não foi possível encerrar a sessão agora.");
      }
    },
    async factors() {
      const { data, error } = await requireClient().auth.mfa.listFactors();
      if (error)
        throw new Error("Não foi possível consultar a proteção da conta.");
      return data;
    },
    async enroll() {
      const factors = await this.factors();
      for (const factor of factors.totp || [])
        if (factor.status === "unverified")
          await client.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "HELP ALL · autenticador",
      });
      if (error) throw new Error("Não foi possível preparar o autenticador.");
      return data;
    },
    async verify(factorId, code) {
      if (!/^\d{6}$/.test(code))
        throw new Error("Informe os 6 números do autenticador.");
      const { error } = await requireClient().auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error)
        throw new Error(
          "Código inválido ou expirado. Confira o autenticador e tente novamente.",
        );
      return true;
    },
  };
}
