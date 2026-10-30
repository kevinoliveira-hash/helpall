/**
 * Adaptador da conta Supabase. Não importa saldos do modo local e não armazena JWT.
 * Cada escrita passa por RLS ou RPC, que valida auth.uid(), limites e MFA no servidor.
 * O catálogo continua ilustrativo. Pedidos simulados NÃO geram crédito automático.
 */
import { createIdempotentAction } from "./auth-core.js";
export async function createCloudStore(client, user) {
  let state = {
    profile: {
      name: "Membro HELP",
      bio: "",
      city: "São Paulo",
      status: "pending",
    },
    location: {
      city: "São Paulo",
      neighborhood: "",
      lat: -23.5614,
      lng: -46.6911,
    },
    coins: { balance: 0, ledger: [], claimedMissions: [], redeemedRewards: [] },
    orders: [],
    posts: [],
    favorites: [],
    messages: {},
    donations: [],
    feedback: [],
    onboarded: true,
    cloud: true,
  };
  const listeners = new Set();
  const copy = () => structuredClone(state);
  const unwrap = (response) => {
    if (response.error) throw response.error;
    return response.data || [];
  };
  const friendly = (error) =>
    /segundo fator/i.test(error.message || "")
      ? "Confirme seu autenticador em Segurança da conta para movimentar HELP."
      : error.code === "P0001"
        ? error.message
        : error.code === "42501"
          ? "Sua conta não tem autorização para esta operação."
          : "Não foi possível salvar. Confira sua conexão e tente novamente.";
  async function refresh() {
    const p = unwrap(
      await client
        .from("help_profiles")
        .select("id,display_name,bio,city,neighborhood,status")
        .eq("id", user.id)
        .single(),
    );
    state.profile = {
      name: p.display_name,
      bio: p.bio,
      city: p.city,
      status: p.status,
    };
    state.location = {
      ...state.location,
      city: p.city,
      neighborhood: p.neighborhood,
    };
    if (p.status !== "active") return;
    const results = await Promise.all([
      client
        .from("help_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single(),
      client
        .from("help_ledger")
        .select("id,type,label,amount,created_at")
        .order("created_at")
        .limit(500),
      client
        .from("help_orders")
        .select(
          "id,item_id,title,provider,category,price,note,scheduled_at,status,reward_approved,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      client.from("help_favorites").select("item_id"),
      client
        .from("help_posts")
        .select("id,user_id,author,text,kind,category,reward,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      client.from("help_likes").select("post_id,user_id").limit(1000),
      client
        .from("help_comments")
        .select("id,post_id,author,text,created_at")
        .order("created_at")
        .limit(1000),
      client.from("help_mission_claims").select("mission_id"),
      client
        .from("help_redemptions")
        .select("id,reward_id,title,cost,code,created_at")
        .order("created_at", { ascending: false }),
      client
        .from("help_donations")
        .select("id,campaign_id,amount,created_at")
        .order("created_at", { ascending: false }),
      client
        .from("help_feedback")
        .select("id,rating,text,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const [
      wallet,
      ledger,
      orders,
      favorites,
      posts,
      likes,
      comments,
      claims,
      redemptions,
      donations,
      feedback,
    ] = results.map(unwrap);
    state.coins = {
      balance: Number(wallet.balance),
      ledger: ledger.map((r) => ({
        ...r,
        amount: Number(r.amount),
        date: r.created_at,
      })),
      claimedMissions: claims.map((r) => r.mission_id),
      redeemedRewards: redemptions.map((r) => ({
        ...r,
        rewardId: r.reward_id,
        date: r.created_at,
        demo: true,
      })),
    };
    state.orders = orders.map((r) => ({
      ...r,
      itemId: r.item_id,
      scheduledAt: r.scheduled_at,
      date: r.created_at,
      coinAwarded: false,
      payment: "Catálogo demonstrativo",
      price: Number(r.price),
    }));
    state.favorites = favorites.map((r) => r.item_id);
    state.posts = posts.map((r) => ({
      ...r,
      date: r.created_at,
      avatar: r.author[0],
      likes: likes.filter((l) => l.post_id === r.id).length,
      liked: likes.some((l) => l.post_id === r.id && l.user_id === user.id),
      comments: comments
        .filter((c) => c.post_id === r.id)
        .map((c) => ({ ...c, date: c.created_at })),
    }));
    state.donations = donations.map((r) => ({
      ...r,
      campaignId: r.campaign_id,
      amount: Number(r.amount),
      date: r.created_at,
    }));
    state.feedback = feedback;
  }
  async function mutate(work, resolve = () => ({})) {
    try {
      const value = await work();
      if (value?.error) throw value.error;
      await refresh();
      for (const listener of listeners) listener(copy());
      return { ok: true, ...resolve(value?.data) };
    } catch (error) {
      return { ok: false, error: friendly(error) };
    }
  }
  const rpc = (name, args, resolve) =>
    mutate(() => client.rpc(name, args), resolve);
  const financial = createIdempotentAction();
  const api = {
    getState: copy,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getPersistenceStatus: () => ({ available: true, recovered: false }),
    updateProfile(p) {
      return mutate(() =>
        client
          .from("help_profiles")
          .update({
            display_name: p.name,
            bio: p.bio || "",
            city: p.city || state.profile.city,
          })
          .eq("id", user.id),
      );
    },
    setLocation(p) {
      return mutate(() =>
        client
          .from("help_profiles")
          .update({
            city: p.city,
            neighborhood: p.neighborhood || state.location.neighborhood,
          })
          .eq("id", user.id),
      );
    },
    toggleFavorite(id) {
      return mutate(() =>
        state.favorites.includes(id)
          ? client
              .from("help_favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("item_id", id)
          : client
              .from("help_favorites")
              .insert({ user_id: user.id, item_id: id }),
      );
    },
    createOrder(p) {
      return rpc(
        "help_create_order",
        {
          p_item: p.itemId,
          p_title: p.title,
          p_provider: p.provider,
          p_category: p.category,
          p_price: p.price,
          p_note: p.note || "",
          p_schedule: p.scheduledAt || "",
        },
        (id) => ({ order: state.orders.find((o) => o.id === id) }),
      );
    },
    advanceOrder(id) {
      return rpc(
        "help_advance_order",
        { p_order: id, p_cancel: false },
        () => ({ order: state.orders.find((o) => o.id === id), earned: 0 }),
      );
    },
    cancelOrder(id) {
      return rpc("help_advance_order", { p_order: id, p_cancel: true });
    },
    addPost(p) {
      return rpc("help_publish", {
        p_text: p.text,
        p_kind: p.kind,
        p_category: p.category,
        p_reward: p.reward || 0,
      });
    },
    toggleLike(id) {
      return rpc("help_toggle_like", { p_post: id });
    },
    addComment(id, text) {
      return rpc("help_comment", { p_post: id, p_text: text });
    },
    claimMission(id) {
      return rpc("help_claim_mission", { p_mission: id }, (earned) => ({
        earned,
      }));
    },
    transferCoins({ recipient, amount }) {
      if (!/^[0-9a-f-]{36}$/i.test(recipient))
        return { ok: false, error: "Informe o código HELP do destinatário." };
      return financial("transfer", { recipient, amount }, (nonce) =>
        rpc("help_transfer", {
          p_recipient: recipient,
          p_amount: amount,
          p_nonce: nonce,
        }),
      );
    },
    donateCoins({ campaignId, amount }) {
      return financial("donate", { campaignId, amount }, (nonce) =>
        rpc("help_donate", {
          p_campaign: campaignId,
          p_amount: amount,
          p_nonce: nonce,
        }),
      );
    },
    redeemReward(id) {
      return financial("redeem", { id }, (nonce) =>
        rpc("help_redeem", { p_reward: id, p_nonce: nonce }, (op) => ({
          redemption: state.coins.redeemedRewards.find((r) => r.id === op),
        })),
      );
    },
    submitFeedback(p) {
      return rpc("help_feedback", { p_rating: p.rating, p_text: p.text });
    },
    sendMessage(id, text) {
      if (!state.orders.some((o) => o.id === id))
        return { ok: false, error: "Pedido não encontrado." };
      // Simulação explícita e efêmera. Este catálogo não contata prestadores reais.
      state.messages[id] ??= [];
      state.messages[id].push(
        {
          role: "user",
          author: state.profile.name,
          text: text.slice(0, 1000),
          date: new Date().toISOString(),
        },
        {
          role: "provider",
          author: "Assistente de demonstração",
          text: "Esta conversa apenas demonstra o catálogo. Nenhuma pessoa real recebe estas mensagens.",
          date: new Date().toISOString(),
        },
      );
      return { ok: true };
    },
    resetDemo() {
      return {
        ok: false,
        error: "Contas conectadas não podem ser reiniciadas pelo navegador.",
      };
    },
  };
  await refresh();
  return api;
}
