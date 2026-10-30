# Configuração do HELP ALL no Supabase

Projeto informado pelo Kevin: `cyuethbcmkjvcnwdsttb`.
Painel: https://supabase.com/dashboard/project/cyuethbcmkjvcnwdsttb
URL pública: https://cyuethbcmkjvcnwdsttb.supabase.co

## Arquivos para editar no VS Code

- `dist/config.js`: URL, chave pública e sinalizador Google. Nunca colocar segredos.
- `dist/auth.js`: autenticação, recuperação e MFA usando o SDK oficial.
- `dist/auth-core.js`: validação, armazenamento temporário e idempotência.
- `dist/auth-ui.js` / `dist/auth.css`: telas e cores de referência.
- `dist/cloud-store.js`: acesso aos dados reais da conta; separado de `dist/store.js` (demonstração).
- `supabase/migrations/`: estrutura e regras SQL versionadas.
- `tests/database.test.mjs`: testes reais de PostgreSQL local descartável.

## Banco

As migrações são para este projeto do HELP ALL. Não aplicar a outros projetos. A primeira deve ser aplicada uma única vez em banco novo. A segunda deve ser aplicada depois dela. Não remover políticas para fazer um erro de acesso desaparecer.

Para aprovar um membro depois da confirmação de e-mail, execute no SQL Editor (substitua o e-mail apenas no painel privado; não grave e-mails de membros no Git):

```sql
update public.help_profiles p
set status = 'active'
from auth.users u
where u.id = p.id
  and u.email = 'EMAIL_DO_MEMBRO'
  and u.email_confirmed_at is not null
  and p.status = 'pending';
```

Não há administrador escondido no front. O status não pode ser escolhido no cadastro. Revise quem tem acesso administrativo à organização e habilite MFA nesses responsáveis.

## URLs de autenticação

Site URL: `https://help-all-primeiros-100-kevin.zanygrebe20.chatgpt.site/`
Redirects exatos necessários no Supabase:

- `https://help-all-primeiros-100-kevin.zanygrebe20.chatgpt.site/`
- `https://help-all-primeiros-100-kevin.zanygrebe20.chatgpt.site/?flow=recovery`
- `http://localhost:4173/` e `http://localhost:4173/?flow=recovery` somente para desenvolvimento.

Não use curingas de domínio em produção. O fluxo de e-mail/PKCE deve voltar ao mesmo navegador que iniciou a operação. Não copie um link de recuperação para outro navegador.

## Google

1. No Google Auth Platform, crie/seleciona um projeto do HELP ALL, com nome e contato válidos.
2. Configure o consentimento com somente `openid`, `email` e `profile`.
3. Crie um cliente OAuth do tipo Web. O redirect autorizado do Google é `https://cyuethbcmkjvcnwdsttb.supabase.co/auth/v1/callback`.
4. No Supabase, habilite Google e preencha Client ID e Client Secret. O segredo deve ser colocado diretamente no painel, não no chat nem no código.
5. Se o app Google estiver em modo de testes, adicione os convidados como usuários de teste; verifique as regras atuais do Google antes de abrir a todos.
6. Só depois altere `googleEnabled` para `true` em `dist/config.js` e valide um login completo.

O botão não faz login fictício nem usa um Client ID de terceiros. Enquanto a configuração não estiver concluída, ele informa que o acesso está em preparação.

## Comandos locais

`npm install` restaura as versões do lockfile. `npm run build` recompila os pacotes locais. `npm test` valida lógica, catálogo, Auth e PostgreSQL. `npm start` serve a experiência em `http://localhost:4173`.

No VS Code abra `HELP-ALL.code-workspace`. As telas podem ser editadas diretamente em `dist`; `dist/vendor` é gerado e não deve ser editado manualmente.
