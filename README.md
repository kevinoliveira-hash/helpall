# HELP ALL · piloto 0.2

Aplicativo para apresentar a proposta aos primeiros 100 convidados: ajuda no bairro, serviços, comunidade e HelpCoins ilustrativas. Interface em azul profundo, verde, turquesa e dourado, baseada nas referências fornecidas.

## Abrir e editar

Abra `HELP-ALL.code-workspace` no VS Code. Dê dois cliques em `ABRIR-APP.cmd` ou execute `npm start`. Acesse http://localhost:4173.

Escolha **Conhecer o app sem entrar** para apresentar a demonstração imediatamente. Endereço direto: http://localhost:4173/?demo=1#home.

Edite a interface nos arquivos de `dist/`. O banco está versionado em `supabase/migrations/`.

## Funcionalidades

- Demonstração: catálogo, pesquisa, favoritos, mapa, CEP, pedidos, comunidade e perfil.
- HelpCoins: carteira, extrato, missões, transferências, doações e cupons simulados. A demonstração inicia com 250 HELP locais.
- Supabase: cadastro por e-mail, confirmação, login, recuperação de senha e segundo fator TOTP.
- Conta conectada: perfil e pedidos privados, comunidade de membros aprovados, feedback e carteira protegidos no banco. Contas começam pendentes, com zero HELP. A equipe aprova os participantes.
- Google preparado no código e identificado como em preparação. O Kevin optou por criar as credenciais posteriormente; o passo a passo está pronto.

Catálogo, parceiros, preços, campanhas e chat são ilustrativos. Pedidos não contratam serviços reais. HelpCoins não têm valor monetário, saque, conversão ou blockchain. Saldos locais nunca são importados para contas.

## Configuração

Projeto: https://supabase.com/dashboard/project/cyuethbcmkjvcnwdsttb

Veja [Configuração e Google](docs/CONFIGURAR-SUPABASE.md) e [Segurança e limites](docs/SEGURANCA.md). O cliente usa apenas chave pública. Nunca coloque senha do banco, service_role ou segredo Google no código.

O site hospedado mantém acesso privado para o Kevin apresentar. Isso ainda não libera acesso externo aos 100 convidados. Antes de inscrições abertas, configure envio de e-mails próprio, proteção contra automação e termos/canal de privacidade.

Sessões ficam em memória: atualizar a página exige novo login. Links de confirmação e recuperação devem abrir no navegador que iniciou a solicitação.

## Verificação

`npm ci` restaura os pacotes. `npm run build` atualiza o SDK Supabase e ícones Lucide locais. `npm test` executa 36 testes, incluindo PostgreSQL descartável, isolamento entre contas, RLS, MFA, saldo, extrato e proteção contra repetição de operações.

`dist/vendor/` é gerado. As bibliotecas são os projetos oficiais Supabase JS e Lucide, com licenças incluídas. O projeto já tem controle de versões; GitHub e Figma não são necessários para esta apresentação.

Veja também [Roteiro de apresentação](ROTEIRO-DEMONSTRACAO.md).

## Entrada beta para apresentação

A entrada padrão agora cria um perfil beta local, apenas com nome/apelido e cidade, sem senha. O Supabase não é acionado neste modo. Veja `docs/APRESENTAR-BETA.md`. O cadastro autenticado descrito acima está preservado para a próxima etapa; a apresentação atual não cria contas reais nem uma lista central de inscritos.

## Deploy público na Vercel e avanço

O arquivo `vercel.json` configura o deploy da pasta `dist`. Veja `docs/DEPLOY-VERCEL.md`. O menu **Nosso avanço** reúne etapas entregues e pendentes e métricas locais. Para atualizar o roteiro de entregas, edite `dist/progress.js`; ele não contém dados privados nem totais globais.
