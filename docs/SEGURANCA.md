# HELP ALL · segurança da versão 0.2

Este documento explica as decisões implementadas e os limites do piloto. Não representa auditoria externa nem garantia absoluta de segurança.

## Autenticação

- SDK oficial `@supabase/supabase-js`, com versão fixa no `package-lock.json` e pacote compilado localmente. Não executamos o SDK de uma CDN.
- Google usa OAuth com PKCE. O código temporário é removido da URL após a troca. O login só estará liberado quando o provedor e seus redirects estiverem configurados no Supabase e no Google Cloud.
- Senhas vão diretamente ao Supabase Auth por HTTPS, não são salvas pelo app e nunca são colocadas em logs. O front pede 12 a 128 caracteres. **O mínimo de 12 também deve ser configurado no painel Supabase** para impedir contorno do formulário.
- Access e refresh tokens ficam em memória. Apenas o verificador temporário PKCE usa sessionStorage para sobreviver à navegação externa. Atualizar ou fechar a página exige novo login; essa escolha reduz a persistência de credenciais no navegador, mas não elimina riscos de XSS.
- A sessão é verificada com `getUser()`. O banco usa o JWT validado pelo Supabase e `auth.uid()` para autorizar ações; nunca confia no user_id do formulário.
- Recuperação evita indicar se um endereço está cadastrado. Confirmação de e-mail deve continuar ativada. Ative CAPTCHA e SMTP próprio antes de cadastro público; a interface não simula CAPTCHA nem tenta contorná-lo.
- Segundo fator TOTP: configurar e verificar em Segurança da conta. Movimentar HELP exige AAL2 no próprio banco, não apenas uma verificação visual.

## Dados e permissões

`supabase/migrations/202610300001_help_all.sql` cria 13 tabelas públicas do aplicativo e um schema privado para operações. Todas as tabelas públicas têm RLS habilitada e forçada. `anon` não recebe acesso às tabelas ou RPCs do app.

Perfil, pedidos, favoritos, feedback, carteira, missões e extrato são privados por dono. Publicações, comentários e apoios são visíveis somente a membros ativos da comunidade. Não publique documentos, telefone, endereço exato ou informações sensíveis nesses campos. A apresentação é escapada antes de entrar no HTML.

As novas contas ficam **pending**. O administrador libera o piloto pelo banco, depois de verificar a confirmação do e-mail. O membro não tem permissão para alterar seu status. A segunda migração restringe a aprovação a 100 contas ativas e revoga privilégios padrão de tabelas e funções futuras.

Não há upload de documentos ou bucket público nesta etapa. A identidade de um membro não é validada por KYC; o nome exibido não é prova de identidade.

## Help Coins

HELP são créditos ilustrativos do piloto, sem saque, conversão, mercado ou integração Ripio. Carteiras conectadas começam com zero; **nenhum saldo da demonstração é importado**.

- Só funções SQL autorizadas alteram saldo. Clientes não recebem INSERT/UPDATE/DELETE nas carteiras ou no extrato.
- Missões têm valores definidos no banco e uma restrição única por pessoa/missão.
- Concluir o próprio pedido simulado não emite coins. A missão de pedido depende de `reward_approved`, que o cliente não pode modificar.
- Transferências exigem destinatário ativo, saldo suficiente e MFA; não há transferência para si mesmo. Bloqueios em ordem fixa reduzem deadlocks.
- Saídas limitadas a 1.000 HELP por operação e por 24 horas. São limites iniciais do piloto e devem ser revistos com dados reais.
- Um nonce por operação torna os retries idempotentes; o app coalesce duplo clique e conserva o nonce se a resposta for incerta.
- O extrato é append-only. Ajustes precisam ser novos lançamentos compensatórios; nunca apague ou edite um lançamento.
- A missão de boas-vindas e demais recompensas são limitadas por conta aprovada, não por pessoa física verificada. A revisão de contas é importante contra múltiplos cadastros.

## Chaves, transporte e navegador

`dist/config.js` contém apenas URL e publishable key (ou anon legada) públicas. `service_role`, `sb_secret`, senha de banco e segredo OAuth jamais entram no cliente, Git ou arquivos de distribuição. As regras RLS são a barreira de acesso; ocultar a publishable key não substitui autorização.

CSP restringe scripts ao próprio site, bloqueia objetos e limita conexões a Supabase e ViaCEP. Não há avaliação dinâmica de código da interface. O service worker ignora códigos OAuth, APIs autenticadas e qualquer chamada externa. O servidor local inclui nosniff, política de referer e bloqueio de câmera/microfone/geolocalização.

O site publicado continua privado no Sites, com sua camada de acesso ChatGPT. O login Supabase do app é uma camada distinta. Tornar o Sites público exige uma decisão explícita de compartilhamento.

## Validação e o que ainda precisa de operação

`npm test` executa testes do app e PostgreSQL local com PGlite: RLS, separação entre usuários, privilégios, rejeição de saldo direto, MFA, missões únicas, replay de transferências/doações e reconciliação do extrato. Os usuários e claims destes testes existem somente no banco descartável de teste, nunca no projeto online.

Antes de um lançamento com usuários reais: confirmar redirects exatos, SMTP, CAPTCHA, política de senhas no servidor, limites de Auth, proteção de senha vazada quando disponível, backup/restauração conforme o plano, alertas, revisão independente das políticas e termos/canal de privacidade. Para dinheiro real, haverá necessidade de outra análise técnica e jurídica; este piloto não oferece custódia financeira.

## Referências oficiais

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://supabase.com/docs/guides/auth/password-security
- https://github.com/supabase/supabase-js
- https://github.com/lucide-icons/lucide
