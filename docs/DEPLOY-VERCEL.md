# Publicar na Vercel

Repositório: https://github.com/kevinoliveira-hash/helpall

1. Na Vercel, escolha Add New > Project e importe `kevinoliveira-hash/helpall`.
2. Mantenha a raiz do projeto como `./` (a pasta que contém package.json e vercel.json).
3. A configuração versionada seleciona Other, executa `npm ci` e `npm run build` e publica `dist`.
4. Não adicione senhas nem variáveis de ambiente: o beta de apresentação não depende do Supabase.
5. Clique Deploy e abra o domínio de produção fornecido pela Vercel.
6. Confira em uma janela anônima: tela beta, criação de perfil local e navegação até Help Coins e Meu perfil > Acompanhar nosso avanço.

O app publicado na Vercel não usa a barreira de login ChatGPT do Sites. Se o projeto Vercel tiver proteção de acesso própria habilitada, revise a configuração de produção no painel antes de convidar pessoas; não compartilhe links de preview protegidos como se fossem a versão pública.

## Acompanhar o avanço

- No app: menu Nosso avanço, ou Meu perfil > Acompanhar nosso avanço no celular.
- `dist/progress.js`: lista de etapas e versão, mantida pela equipe.
- Números de uso: calculados apenas com ações neste navegador, sem inventar totais do piloto.
- GitHub: histórico de commits mostra mudanças entregues.
- Vercel: Deployments mostra o resultado de cada publicação conectada ao GitHub.

Ainda não há painel central de cadastros, visitantes ou feedback. Esse acompanhamento conjunto será conectado ao banco numa próxima etapa. O beta não coleta senha, e-mail, documento ou pagamentos.

Referência oficial da configuração: https://vercel.com/docs/project-configuration/vercel-json
