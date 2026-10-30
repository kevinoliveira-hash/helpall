import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validatePublicConfig,
  createSessionStorage,
  validateSignup,
  authError,
  createIdempotentAction,
} from "../dist/auth-core.js";
test("public config rejects administrative keys and unsafe URLs", () => {
  const key = "sb_publishable_" + "a".repeat(30),
    url = "https://cyuethbcmkjvcnwdsttb.supabase.co";
  assert.equal(validatePublicConfig({ url, publishableKey: key }).ok, true);
  for (const bad of ["sb_secret_123", "service_role", "", null])
    assert.equal(validatePublicConfig({ url, publishableKey: bad }).ok, false);
  for (const bad of [
    "http://example.com",
    "https://example.com",
    "https://evil.supabase.co.evil.com",
    "https://user:password@ok.supabase.co",
    "https://ok.supabase.co/extra",
  ])
    assert.equal(
      validatePublicConfig({ url: bad, publishableKey: key }).ok,
      false,
    );
  const jwt = (role) => "a." + btoa(JSON.stringify({ role })) + ".b";
  assert.equal(
    validatePublicConfig({ url, publishableKey: jwt("service_role") }).ok,
    false,
  );
  assert.equal(
    validatePublicConfig({ url, publishableKey: jwt("anon") }).ok,
    true,
  );
});
test("session adapter persists only PKCE verifier and never session tokens", () => {
  const persisted = new Map();
  const temporary = {
    getItem: (k) => persisted.get(k),
    setItem: (k, v) => persisted.set(k, v),
    removeItem: (k) => persisted.delete(k),
  };
  const store = createSessionStorage(temporary);
  store.setItem("sb-project-auth-token", "secret-token");
  store.setItem("sb-project-auth-token-code-verifier", "temporary-verifier");
  assert.equal(persisted.has("sb-project-auth-token"), false);
  assert.equal(
    persisted.get("sb-project-auth-token-code-verifier"),
    "temporary-verifier",
  );
  const reload = createSessionStorage(temporary);
  assert.equal(reload.getItem("sb-project-auth-token"), null);
  assert.equal(
    reload.getItem("sb-project-auth-token-code-verifier"),
    "temporary-verifier",
  );
  store.removeItem("sb-project-auth-token-code-verifier");
  assert.equal(persisted.size, 0);
});
test("signup validates length, confirmation and pilot privacy consent", () => {
  const good = {
    name: "Pessoa Teste",
    email: "pessoa@example.com",
    password: "uma senha exclusiva longa",
    confirmation: "uma senha exclusiva longa",
    consent: true,
  };
  assert.equal(validateSignup(good), null);
  for (const patch of [
    { name: "a" },
    { email: "inválido" },
    { password: "curta" },
    { confirmation: "outra" },
    { consent: false },
  ])
    assert.equal(typeof validateSignup({ ...good, ...patch }), "string");
});
test("unrecognized auth errors never reveal raw provider messages", () => {
  assert.equal(
    authError({ message: "private database details token=secret" }),
    "Não foi possível concluir agora. Tente novamente em instantes.",
  );
  assert.match(authError({ status: 429 }), /Muitas tentativas/);
});
test("financial retry and double clicks use one nonce; a completed new action gets a new nonce", async () => {
  let sequence = 0,
    calls = 0,
    release;
  const run = createIdempotentAction(() => `nonce-${++sequence}`);
  const action = (nonce) => {
    calls++;
    return new Promise((resolve) => {
      release = () => resolve({ ok: false, nonce });
    });
  };
  const first = run("transfer", { amount: 25 }, action),
    second = run("transfer", { amount: 25 }, action);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  release();
  const failed = await first;
  const retry = await run("transfer", { amount: 25 }, async (nonce) => ({
    ok: true,
    nonce,
  }));
  assert.equal(retry.nonce, failed.nonce);
  const next = await run("transfer", { amount: 25 }, async (nonce) => ({
    ok: true,
    nonce,
  }));
  assert.notEqual(next.nonce, retry.nonce);
});
