# HELP ALL · primeira versão demonstrativa

Uma experiência interativa para apresentar a ideia do HELP ALL aos primeiros 100 convidados: encontrar serviços e oportunidades no bairro, pedir e oferecer ajuda, acompanhar pedidos e experimentar Help Coins.

Esta versão funciona no navegador e guarda a atividade no próprio dispositivo. Os exemplos de parceiros, ofertas, publicações e campanhas são fictícios. O selo dos primeiros 100 apresenta o piloto; ele não representa uma contagem central de inscrições.

## Como abrir no Windows

1. Tenha o Node.js instalado no computador.
2. Abra a pasta `help-all` e dê dois cliques em `ABRIR-APP.cmd`.
3. Mantenha a janela aberta enquanto usa o app. O endereço local é **http://localhost:4173**.
4. Para encerrar, feche a janela do servidor ou pressione `Ctrl+C` nela.

Outra forma de abrir: no terminal, dentro da pasta `help-all`, execute:

```text
npm start
```

O app não precisa de instalação de pacotes para iniciar. Abra pelo endereço acima para que os módulos do app funcionem corretamente.

## O que é possível experimentar

- Explorar categorias, pesquisar ofertas, ver detalhes e salvar favoritos.
- Consultar o mapa e escolher a localização pelo CEP.
- Criar um pedido demonstrativo, acompanhar as etapas, cancelar antes da conclusão e conversar em um chat simulado.
- Concluir um pedido e receber **25 Help Coins ilustrativas**, uma única vez por pedido.
- Consultar saldo e extrato, cumprir missões, resgatar cupons e simular transferências e doações de Help Coins.
- Publicar pedidos de ajuda, ofertas de ajuda e histórias na comunidade; curtir e comentar publicações.
- Personalizar o perfil, registrar feedback e exportar os dados da demonstração.

As interações ficam disponíveis para conhecer os fluxos do produto. Um pedido não contrata uma pessoa ou estabelecimento real; as mensagens simulam respostas de parceiros.

## Help Coins nesta versão

Cada demonstração nova começa com **250 Help Coins**. Há missões de boas-vindas, perfil, primeiro pedido concluído e participação na comunidade. Cada missão pode ser resgatada uma única vez no perfil local.

Transferências, doações e resgates descontam o saldo demonstrativo e aparecem no extrato. O app valida valores inteiros e saldo disponível. As doações atualizam apenas a demonstração local; elas não entregam recursos a uma instituição. Cupons não têm validade comercial.

Help Coins **não têm valor monetário nesta versão**. Não há compra, venda, saque, conversão, pagamento real, blockchain, carteira de custódia ou integração operacional com Ripio. As marcas citadas como inspiração não são parceiras nem serviços integrados ao app.

## Dados, privacidade e serviços públicos

Os dados da demonstração são guardados no armazenamento local do navegador. Reabrir o app no mesmo navegador e endereço mantém a atividade enquanto esse armazenamento estiver disponível. Outro navegador, outro dispositivo ou outro endereço terá uma demonstração própria. Limpar os dados do navegador pode apagar essa atividade.

O arquivo exportado é salvo no dispositivo e contém os dados locais da demonstração. Ele não cria uma cópia compartilhada nem sincroniza usuários. O feedback também é local e pode ser levado junto na exportação; ele não é enviado automaticamente para uma equipe.

Os únicos serviços públicos usados na experiência são:

- **ViaCEP:** consulta do CEP informado para obter cidade e bairro.
- **OpenStreetMap:** visualização do mapa da região selecionada.

Esses recursos dependem de internet e da disponibilidade dos serviços. O CEP consultado é enviado ao ViaCEP; o carregamento do mapa faz uma conexão com o OpenStreetMap. Pedidos, publicações e Help Coins continuam sendo dados locais, sem um servidor de contas do HELP ALL.

## Como apresentar

Use `ROTEIRO-DEMONSTRACAO.md` para uma apresentação de aproximadamente cinco minutos. A mesma versão pode ser mostrada a diferentes convidados para colher suas primeiras impressões. Cada dispositivo mantém sua própria atividade.

## Verificação

Dentro da pasta `help-all`, execute:

```text
npm test
```

Os testes verificam o estado local, saldo e extrato, resgates únicos de missões, etapas de pedidos, persistência, recuperação de dados inválidos, doações e interações da comunidade.

## Próxima etapa para um piloto com 100 usuários conectados

Para que pessoas reais interajam entre dispositivos, a próxima etapa é criar um servidor com banco de dados e autenticação. Isso inclui cadastro e acesso de usuários, pedidos e conversas compartilhados, moderação e denúncias, operação de parceiros, tratamento de feedback e acompanhamento do piloto.

O saldo, as transferências e as recompensas de Help Coins precisam ser validados no servidor antes de terem uso compartilhado. Pagamentos reais, identidade de parceiros e qualquer eventual uso financeiro exigem implementação e validação próprias.

Esta entrega é a base demonstrativa para revisar a experiência, apresentar a proposta e decidir as prioridades dessa próxima etapa.
