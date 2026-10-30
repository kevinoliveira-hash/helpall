/**
 * CONFIGURAÇÃO PÚBLICA DO PROJETO — pode aparecer no navegador.
 * Preencha SOMENTE com a URL e a publishable key do projeto HELP ALL.
 * O controle de acesso é feito pelo Supabase Auth e pelas políticas RLS da migration.
 * NUNCA coloque senha, service_role ou sb_secret neste arquivo.
 */
export const SUPABASE_CONFIG = Object.freeze({
  url: "https://cyuethbcmkjvcnwdsttb.supabase.co",
  publishableKey: "sb_publishable_uGCUY5_0II67OPPFZEq2vQ_zxuivAlD",
  // Ative somente após habilitar Google e cadastrar os redirects exatos no painel.
  googleEnabled: false,
  // O cadastro exige confirmação de e-mail no Supabase e aprovação no piloto.
  pilotApprovalRequired: true,
});
