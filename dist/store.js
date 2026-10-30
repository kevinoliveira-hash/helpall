/** Local demonstration state. Help Coins have no monetary value. */
export const STORAGE_KEY = "help-all-demo-v1";
export const MISSIONS = Object.freeze([
  {
    id: "welcome",
    title: "Boas-vindas ao HELP",
    description: "Resgate seu presente de boas-vindas.",
    amount: 50,
  },
  {
    id: "profile",
    title: "Deixe o perfil com a sua cara",
    description: "Salve seu nome no perfil.",
    amount: 40,
  },
  {
    id: "order",
    title: "Sua primeira experiência",
    description: "Conclua um pedido demonstrativo.",
    amount: 75,
  },
  {
    id: "community",
    title: "Faça parte da conversa",
    description: "Publique na comunidade do bairro.",
    amount: 30,
  },
]);
export const REWARDS = Object.freeze([
  {
    id: "delivery",
    title: "Entrega por nossa conta",
    cost: 100,
    description: "Cupom ilustrativo de entrega para experimentar no piloto.",
  },
  {
    id: "service",
    title: "Benefício no próximo serviço",
    cost: 200,
    description: "Um benefício demonstrativo para o seu próximo pedido.",
  },
  {
    id: "pioneer",
    title: "Selo Pioneiro HELP",
    cost: 150,
    description: "Um selo especial de quem chegou no começo.",
  },
]);
const MAX_COINS = 1_000_000_000;
const ORDER_STATUSES = ["solicitado", "confirmado", "a_caminho", "concluido"];
const copy = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `help-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
const fail = (error) => ({ ok: false, error });
const clean = (value, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const unique = (values) =>
  Array.isArray(values) && new Set(values).size === values.length;
const validDate = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const safeAmount = (value) =>
  Number.isSafeInteger(value) && value > 0 && value <= MAX_COINS;

function initialState() {
  return {
    version: 1,
    profile: { name: "Visitante", bio: "", city: "São Paulo", cep: "" },
    location: {
      city: "São Paulo",
      neighborhood: "Pinheiros",
      lat: -23.5614,
      lng: -46.6911,
      cep: "",
    },
    coins: {
      balance: 250,
      ledger: [
        {
          id: uid(),
          type: "welcome",
          label: "Presente de boas-vindas · demonstração",
          amount: 250,
          date: now(),
        },
      ],
      claimedMissions: [],
      redeemedRewards: [],
    },
    orders: [],
    favorites: [],
    posts: [],
    messages: {},
    donations: [],
    onboarded: false,
  };
}

function validState(s) {
  if (!s || s.version !== 1 || !s.profile || !s.location || !s.coins)
    return false;
  if (
    typeof s.profile.name !== "string" ||
    s.profile.name.length < 2 ||
    s.profile.name.length > 60
  )
    return false;
  if (
    typeof s.profile.bio !== "string" ||
    typeof s.profile.city !== "string" ||
    typeof s.profile.cep !== "string"
  )
    return false;
  if (
    typeof s.location.city !== "string" ||
    typeof s.location.neighborhood !== "string"
  )
    return false;
  if (
    !Number.isFinite(s.location.lat) ||
    Math.abs(s.location.lat) > 90 ||
    !Number.isFinite(s.location.lng) ||
    Math.abs(s.location.lng) > 180
  )
    return false;
  const c = s.coins;
  if (
    !Number.isSafeInteger(c.balance) ||
    c.balance < 0 ||
    c.balance > MAX_COINS ||
    !Array.isArray(c.ledger) ||
    !c.ledger.length
  )
    return false;
  if (
    !unique(c.ledger.map((x) => x?.id)) ||
    !c.ledger.every(
      (x) =>
        typeof x.id === "string" &&
        typeof x.label === "string" &&
        typeof x.type === "string" &&
        Number.isSafeInteger(x.amount) &&
        x.amount !== 0 &&
        Math.abs(x.amount) <= MAX_COINS &&
        validDate(x.date),
    )
  )
    return false;
  let total = 0;
  for (const transaction of c.ledger) {
    total += transaction.amount;
    if (!Number.isSafeInteger(total) || total < 0 || total > MAX_COINS)
      return false;
  }
  if (
    total !== c.balance ||
    !unique(c.claimedMissions) ||
    !c.claimedMissions.every((id) => MISSIONS.some((m) => m.id === id))
  )
    return false;
  if (
    !Array.isArray(c.redeemedRewards) ||
    !unique(c.redeemedRewards.map((x) => x?.id)) ||
    !c.redeemedRewards.every(
      (x) =>
        REWARDS.some((r) => r.id === x.rewardId && r.cost === x.cost) &&
        typeof x.code === "string" &&
        validDate(x.date),
    )
  )
    return false;
  if (!unique(s.favorites) || !s.favorites.every((x) => typeof x === "string"))
    return false;
  if (!Array.isArray(s.orders) || !unique(s.orders.map((x) => x?.id)))
    return false;
  if (
    !s.orders.every(
      (o) =>
        typeof o.id === "string" &&
        typeof o.title === "string" &&
        Number.isFinite(o.price) &&
        o.price >= 0 &&
        [...ORDER_STATUSES, "cancelado"].includes(o.status) &&
        typeof o.coinAwarded === "boolean" &&
        validDate(o.date) &&
        Array.isArray(o.history) &&
        o.history.length > 0 &&
        o.history.every(
          (h) =>
            [...ORDER_STATUSES, "cancelado"].includes(h.status) &&
            validDate(h.date),
        ),
    )
  )
    return false;
  if (
    !Array.isArray(s.posts) ||
    !unique(s.posts.map((x) => x?.id)) ||
    !s.posts.every(
      (p) =>
        typeof p.id === "string" &&
        typeof p.text === "string" &&
        typeof p.author === "string" &&
        Number.isSafeInteger(p.likes) &&
        p.likes >= 0 &&
        typeof p.liked === "boolean" &&
        Array.isArray(p.comments) &&
        p.comments.every(
          (cmt) =>
            typeof cmt.text === "string" && typeof cmt.author === "string",
        ),
    )
  )
    return false;
  if (s.donations === undefined) s.donations = [];
  if (
    !Array.isArray(s.donations) ||
    !unique(s.donations.map((x) => x?.id)) ||
    !s.donations.every(
      (d) =>
        ["food", "learning", "care"].includes(d.campaignId) &&
        safeAmount(d.amount) &&
        validDate(d.date),
    )
  )
    return false;
  if (
    !s.messages ||
    typeof s.messages !== "object" ||
    Array.isArray(s.messages)
  )
    return false;
  return Object.entries(s.messages).every(
    ([id, messages]) =>
      s.orders.some((o) => o.id === id) &&
      Array.isArray(messages) &&
      unique(messages.map((m) => m?.id)) &&
      messages.every(
        (m) =>
          typeof m.id === "string" &&
          typeof m.text === "string" &&
          ["user", "provider"].includes(m.role) &&
          validDate(m.date),
      ),
  );
}

export function createStore(storage) {
  if (arguments.length === 0) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  let state = initialState();
  let recovered = false;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (validState(parsed)) state = parsed;
      else recovered = true;
    }
  } catch {
    recovered = true;
  }
  const listeners = new Set();
  let persistenceAvailable = !!storage;
  function persist() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      persistenceAvailable = false;
    }
  }
  persist();
  function changed(result = {}) {
    persist();
    for (const fn of listeners) {
      try {
        fn(copy(state));
      } catch (error) {
        console.error("HELP: atualização de interface não concluída.", error);
      }
    }
    return { ok: true, ...copy(result) };
  }
  function transaction(type, label, amount, extra = {}) {
    const balance = state.coins.balance + amount;
    if (
      !Number.isSafeInteger(amount) ||
      !amount ||
      !Number.isSafeInteger(balance) ||
      balance < 0 ||
      balance > MAX_COINS
    )
      return false;
    state.coins.balance = balance;
    state.coins.ledger.push({
      id: uid(),
      type,
      label,
      amount,
      date: now(),
      ...extra,
    });
    return true;
  }
  const api = {
    getState: () => copy(state),
    getPersistenceStatus: () => ({
      available: persistenceAvailable,
      recovered,
    }),
    subscribe(fn) {
      if (typeof fn !== "function")
        throw new TypeError("A atualização precisa ser uma função.");
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    updateProfile(input = {}) {
      const next = { ...state.profile };
      if ("name" in input) {
        const name = clean(input.name, 60);
        if (name.length < 2)
          return fail("Informe um nome com pelo menos 2 letras.");
        next.name = name;
      }
      if ("bio" in input) next.bio = clean(input.bio, 280);
      if ("city" in input)
        next.city = clean(input.city, 80) || state.profile.city;
      if ("cep" in input) {
        const cep = clean(input.cep, 12).replace(/\D/g, "");
        if (cep && cep.length !== 8)
          return fail("Informe um CEP com 8 números.");
        next.cep = cep;
      }
      state.profile = next;
      state.onboarded = next.name.toLowerCase() !== "visitante";
      return changed({ profile: next });
    },
    setLocation(input = {}) {
      const next = { ...state.location };
      if (
        "lat" in input &&
        (!Number.isFinite(input.lat) || Math.abs(input.lat) > 90)
      )
        return fail("Latitude inválida.");
      if (
        "lng" in input &&
        (!Number.isFinite(input.lng) || Math.abs(input.lng) > 180)
      )
        return fail("Longitude inválida.");
      if ("lat" in input) next.lat = input.lat;
      if ("lng" in input) next.lng = input.lng;
      if ("city" in input) next.city = clean(input.city, 80) || next.city;
      if ("neighborhood" in input)
        next.neighborhood = clean(input.neighborhood, 80) || next.neighborhood;
      if ("cep" in input) {
        const cep = clean(input.cep, 12).replace(/\D/g, "");
        if (cep && cep.length !== 8)
          return fail("Informe um CEP com 8 números.");
        next.cep = cep;
      }
      state.location = next;
      state.profile.city = next.city;
      state.profile.cep = next.cep || "";
      return changed({ location: next });
    },
    toggleFavorite(id) {
      id = clean(id, 100);
      if (!id) return fail("Escolha uma opção para salvar.");
      const index = state.favorites.indexOf(id);
      if (index < 0) state.favorites.push(id);
      else state.favorites.splice(index, 1);
      return changed({ favorite: index < 0 });
    },
    createOrder(input = {}) {
      const title = clean(input.title, 160);
      const itemId = clean(input.itemId, 100);
      const price = input.price;
      if (!title || !itemId) return fail("Escolha um serviço ou produto.");
      if (!Number.isFinite(price) || price < 0 || price > 1_000_000)
        return fail("Valor de demonstração inválido.");
      const date = now();
      const order = {
        id: uid(),
        itemId,
        title,
        price,
        category: clean(input.category, 60),
        provider: clean(input.provider, 100) || "Parceiro HELP",
        note: clean(input.note, 600),
        scheduledAt: clean(input.scheduledAt, 100),
        payment: clean(input.payment, 100) || "Demonstração",
        status: "solicitado",
        coinAwarded: false,
        date,
        updatedAt: date,
        history: [{ status: "solicitado", date }],
      };
      state.orders.unshift(order);
      state.messages[order.id] = [
        {
          id: uid(),
          role: "provider",
          author: order.provider,
          text: "Demonstração: recebemos seu pedido! Acompanhe as etapas por aqui. Nenhum serviço real foi contratado.",
          date,
          isDemo: true,
        },
      ];
      return changed({ order });
    },
    advanceOrder(id) {
      const order = state.orders.find((o) => o.id === id);
      if (!order) return fail("Pedido não encontrado.");
      const index = ORDER_STATUSES.indexOf(order.status);
      if (index < 0) return fail("Este pedido foi cancelado.");
      if (index === ORDER_STATUSES.length - 1)
        return fail("Este pedido já foi concluído.");
      const status = ORDER_STATUSES[index + 1];
      if (status === "concluido" && !order.coinAwarded) {
        if (
          !transaction("earn", `Pedido concluído: ${order.title}`, 25, {
            orderId: id,
          })
        )
          return fail("O saldo alcançou o limite da demonstração.");
        order.coinAwarded = true;
      }
      order.status = status;
      order.updatedAt = now();
      order.history.push({ status, date: order.updatedAt });
      return changed({ order, earned: status === "concluido" ? 25 : 0 });
    },
    cancelOrder(id) {
      const order = state.orders.find((o) => o.id === id);
      if (!order) return fail("Pedido não encontrado.");
      if (order.status === "concluido")
        return fail("Pedidos concluídos não podem ser cancelados.");
      if (order.status === "cancelado")
        return fail("Este pedido já foi cancelado.");
      order.status = "cancelado";
      order.updatedAt = now();
      order.history.push({ status: "cancelado", date: order.updatedAt });
      return changed({ order });
    },
    sendMessage(orderId, value) {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail("Pedido não encontrado.");
      const text = clean(value, 1000);
      if (!text) return fail("Escreva sua mensagem.");
      const messages = (state.messages[orderId] ||= []);
      const message = {
        id: uid(),
        role: "user",
        author: state.profile.name,
        text,
        date: now(),
        isDemo: true,
      };
      messages.push(message, {
        id: uid(),
        role: "provider",
        author: order.provider,
        text: "Demonstração: obrigado pela mensagem! Este chat simula uma conversa com o parceiro. Você pode avançar o pedido para conhecer todas as etapas.",
        date: now(),
        isDemo: true,
      });
      return changed({ message });
    },
    addPost(input = {}) {
      const text = clean(input.text, 1000);
      if (text.length < 3)
        return fail("Escreva uma publicação com pelo menos 3 caracteres.");
      const date = now();
      const kind = ["help", "offer", "story"].includes(input.kind)
        ? input.kind
        : "story";
      const reward =
        input.reward === undefined || input.reward === "" ? 0 : input.reward;
      if (!Number.isSafeInteger(reward) || reward < 0 || reward > MAX_COINS)
        return fail(
          "A recompensa ilustrativa precisa ser um número inteiro e positivo, ou zero.",
        );
      const post = {
        id: uid(),
        text,
        category: clean(input.category, 60) || "Bairro",
        kind,
        reward,
        author: state.profile.name,
        avatar: state.profile.name.charAt(0).toUpperCase(),
        likes: 0,
        liked: false,
        comments: [],
        date,
        createdAt: date,
        isDemo: true,
      };
      state.posts.unshift(post);
      return changed({ post });
    },
    toggleLike(postId) {
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return fail("Publicação não encontrada.");
      post.liked = !post.liked;
      post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
      return changed({ liked: post.liked });
    },
    addComment(postId, value) {
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return fail("Publicação não encontrada.");
      const text = clean(value, 500);
      if (!text) return fail("Escreva seu comentário.");
      const comment = {
        id: uid(),
        text,
        author: state.profile.name,
        date: now(),
      };
      post.comments.push(comment);
      return changed({ comment });
    },
    claimMission(id) {
      const mission = MISSIONS.find((m) => m.id === id);
      if (!mission) return fail("Missão não encontrada.");
      if (state.coins.claimedMissions.includes(id))
        return fail("Você já resgatou esta missão.");
      if (
        id === "profile" &&
        (!state.onboarded || state.profile.name.toLowerCase() === "visitante")
      )
        return fail("Salve seu nome no perfil para concluir esta missão.");
      if (id === "order" && !state.orders.some((o) => o.status === "concluido"))
        return fail("Conclua um pedido demonstrativo para resgatar.");
      if (id === "community" && !state.posts.length)
        return fail("Faça uma publicação na comunidade para resgatar.");
      if (
        !transaction("mission", mission.title, mission.amount, {
          missionId: id,
        })
      )
        return fail("O saldo alcançou o limite da demonstração.");
      state.coins.claimedMissions.push(id);
      return changed({ mission, earned: mission.amount });
    },
    redeemReward(id) {
      const reward = REWARDS.find((r) => r.id === id);
      if (!reward) return fail("Benefício não encontrado.");
      if (state.coins.balance < reward.cost)
        return fail("Você ainda não tem Help Coins suficientes.");
      const redemption = {
        id: uid(),
        rewardId: reward.id,
        title: reward.title,
        cost: reward.cost,
        code: `HELP-${uid().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
        date: now(),
        demo: true,
      };
      if (
        !transaction(
          "redeem",
          `Resgate ilustrativo: ${reward.title}`,
          -reward.cost,
          { redemptionId: redemption.id },
        )
      )
        return fail("Não foi possível resgatar este benefício.");
      state.coins.redeemedRewards.unshift(redemption);
      return changed({ reward, redemption, code: redemption.code });
    },
    transferCoins(input = {}) {
      const recipient = clean(input.recipient, 80);
      const amount = input.amount;
      if (recipient.length < 2)
        return fail("Informe o nome de quem receberia as coins.");
      if (!safeAmount(amount))
        return fail("Informe uma quantidade inteira e positiva de Help Coins.");
      if (state.coins.balance < amount)
        return fail("Saldo insuficiente para esta transferência ilustrativa.");
      if (
        !transaction(
          "transfer",
          `Transferência ilustrativa para ${recipient}`,
          -amount,
          { recipient, demo: true },
        )
      )
        return fail("Não foi possível simular a transferência.");
      return changed({ recipient, amount });
    },
    donateCoins(input = {}) {
      const titles = {
        food: "Mesa cheia, bairro unido",
        learning: "Conhecimento que aproxima",
        care: "Cuidar também é ajudar",
      };
      const { campaignId, amount } = input;
      if (!Object.hasOwn(titles, campaignId))
        return fail("Campanha não encontrada.");
      if (!safeAmount(amount))
        return fail("Informe uma quantidade inteira e positiva de Help Coins.");
      if (state.coins.balance < amount)
        return fail("Saldo insuficiente para esta doação ilustrativa.");
      const donation = {
        id: uid(),
        campaignId,
        amount,
        date: now(),
        demo: true,
      };
      if (
        !transaction(
          "donation",
          `Doação ilustrativa: ${titles[campaignId]}`,
          -amount,
          { donationId: donation.id, campaignId, demo: true },
        )
      )
        return fail("Não foi possível simular a doação.");
      state.donations.unshift(donation);
      return changed({ donation });
    },
    resetDemo() {
      state = initialState();
      recovered = false;
      return changed();
    },
  };
  return api;
}
