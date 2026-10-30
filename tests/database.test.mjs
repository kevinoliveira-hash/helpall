/**
 * Executa PostgreSQL real em WASM (PGlite), sem credenciais nem rede.
 * As funções auth.uid()/auth.jwt() são mocks apenas neste banco descartável.
 * Isso não substitui a validação final no projeto Supabase com usuários reais.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const migration = await readFile(
  new URL("../supabase/migrations/202610300001_help_all.sql", import.meta.url),
  "utf8",
);
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,email text);
create function auth.uid() returns uuid language sql as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`);
await db.exec(migration);
await db.exec(await readFile(new URL('../supabase/migrations/202610300002_defaults.sql',import.meta.url),'utf8'));
await db.exec(`insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values('${A}',now(),' {"display_name":"Ana"}'),('${B}',now(),'{"display_name":"Bruno"}'),('${C}',null,'{"display_name":"Carla"}');
update public.help_profiles set status='active' where id in ('${A}','${B}');`);
async function asUser(id, aal = "aal1") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: id, aal, role: "authenticated" }),
  ]);
  await db.exec("set role authenticated");
}
async function admin() {
  await db.exec("reset role");
}
async function value(sql, args = []) {
  return (await db.query(sql, args)).rows[0];
}
async function denied(sql, args = []) {
  await assert.rejects(db.query(sql, args));
}

test("Supabase migration: isolated records, immutable ledger, MFA and idempotent coins", async (t) => {
  await t.test(
    "schema deploys with RLS on all HELP tables and no anonymous reads",
    async () => {
      const rows = await db.query(
        "select relname,relrowsecurity,relforcerowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname like 'help_%'",
      );
      assert.equal(rows.rows.length, 13);
      assert.ok(
        rows.rows.every((r) => r.relrowsecurity && r.relforcerowsecurity),
      );
      await db.exec("set role anon");
      await denied("select * from public.help_wallets");
      await denied("select public.help_claim_mission('welcome')");
      await admin();
    },
  );
  await t.test(
    "Auth trigger starts pending accounts at zero and ignores metadata roles",
    async () => {
      assert.equal(
        (
          await value(
            "select balance::int from public.help_wallets where user_id=$1",
            [A],
          )
        ).balance,
        0,
      );
      assert.equal(
        (
          await value("select status from public.help_profiles where id=$1", [
            C,
          ])
        ).status,
        "pending",
      );
    },
  );
  await t.test(
    "member sees own profile/wallet only and cannot change status or balance",
    async () => {
      await asUser(A);
      assert.equal(
        (await db.query("select * from public.help_profiles")).rows.length,
        1,
      );
      assert.equal(
        (
          await db.query("select * from public.help_wallets where user_id=$1", [
            B,
          ])
        ).rows.length,
        0,
      );
      await denied(
        "update public.help_profiles set status='active' where id=$1",
        [A],
      );
      await denied(
        "update public.help_wallets set balance=99999 where user_id=$1",
        [A],
      );
      await denied(
        "insert into public.help_ledger(user_id,operation_id,type,label,amount) values($1,gen_random_uuid(),'fake','fake',100)",
        [A],
      );
    },
  );
  await t.test(
    "pending/unconfirmed accounts cannot mint credits or publish",
    async () => {
      await asUser(C);
      await denied("select public.help_claim_mission('welcome')");
      await denied(
        "select public.help_publish('publicação teste','story','community',0)",
      );
    },
  );
  await t.test(
    "missions award only once and preserve balance after rejected duplicate",
    async () => {
      await asUser(A);
      assert.equal(
        Number(
          (await value("select public.help_claim_mission('welcome') as amount"))
            .amount,
        ),
        50,
      );
      await denied("select public.help_claim_mission('welcome')");
      assert.equal(
        Number(
          (await value("select balance from public.help_wallets")).balance,
        ),
        50,
      );
      await denied("select public.help_claim_mission('order')");
      await value("select public.help_claim_mission('profile')");
    },
  );
  await t.test(
    "user content author is taken from the verified account",
    async () => {
      await asUser(A);
      const post = (
        await value(
          "select public.help_publish('Tenho tempo para ajudar com currículo.','offer','community',0) as id",
        )
      ).id;
      assert.equal(
        (
          await value("select author from public.help_posts where id=$1", [
            post,
          ])
        ).author,
        "Ana",
      );
      await value("select public.help_claim_mission('community')");
    },
  );
  await t.test(
    "orders are private; client completion does not emit coins or approve itself",
    async () => {
      await asUser(A);
      const before = Number(
        (await value("select balance from public.help_wallets")).balance,
      );
      const order = (
        await value(
          "select public.help_create_order('item','Pedido teste','Parceiro demo','services',20) as id",
        )
      ).id;
      for (let i = 0; i < 3; i++)
        await value("select public.help_advance_order($1)", [order]);
      assert.equal(
        Number(
          (await value("select balance from public.help_wallets")).balance,
        ),
        before,
      );
      await denied(
        "update public.help_orders set reward_approved=true where id=$1",
        [order],
      );
      await denied("select public.help_claim_mission('order')");
      await asUser(B);
      await denied("select public.help_advance_order($1)", [order]);
      assert.equal(
        (await db.query("select * from public.help_orders")).rows.length,
        0,
      );
    },
  );
  await t.test(
    "transfers require MFA and reject null, zero, negative, self and overdraft",
    async () => {
      await asUser(A);
      await denied("select public.help_transfer($1,10,gen_random_uuid())", [B]);
      await asUser(A, "aal2");
      for (const amount of [0, -1, 1001, null])
        await denied("select public.help_transfer($1,$2,gen_random_uuid())", [
          B,
          amount,
        ]);
      await denied("select public.help_transfer($1,1,gen_random_uuid())", [A]);
      await denied("select public.help_transfer($1,500,gen_random_uuid())", [
        B,
      ]);
    },
  );
  await t.test(
    "replayed transfer credits receiver once and rejects changed payload",
    async () => {
      await asUser(A, "aal2");
      const nonce = crypto.randomUUID();
      await value("select public.help_transfer($1,25,$2)", [B, nonce]);
      await value("select public.help_transfer($1,25,$2)", [B, nonce]);
      await denied("select public.help_transfer($1,26,$2)", [B, nonce]);
      await asUser(B);
      assert.equal(
        Number(
          (await value("select balance from public.help_wallets")).balance,
        ),
        25,
      );
    },
  );
  await t.test(
    "donation replay changes the campaign total exactly once",
    async () => {
      await asUser(A, "aal2");
      const nonce = crypto.randomUUID();
      await value("select public.help_donate('food',10,$1)", [nonce]);
      await value("select public.help_donate('food',10,$1)", [nonce]);
      assert.equal(
        Number(
          (
            await value(
              "select total from public.help_campaigns where id='food'",
            )
          ).total,
        ),
        10,
      );
    },
  );
  await t.test(
    "ledger totals reconcile to wallet balances; clients cannot call private spend",
    async () => {
      await asUser(A, "aal2");
      await denied(
        "select help_private.spend('x',1,'x',gen_random_uuid(),'x')",
      );
      await admin();
      const rows = await db.query(
        "select w.user_id,w.balance,coalesce(sum(l.amount),0) as total from public.help_wallets w left join public.help_ledger l on l.user_id=w.user_id group by w.user_id,w.balance",
      );
      assert.ok(rows.rows.every((r) => Number(r.balance) === Number(r.total)));
      await denied("update public.help_ledger set label=label");
    },
  );
  await db.close();
});
