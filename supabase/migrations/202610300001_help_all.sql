-- HELP ALL · banco inicial do piloto. Leia docs/SEGURANCA.md antes de aplicar.
-- Execute em projeto NOVO. Nenhuma senha, chave administrativa ou e-mail é incluído.
-- A autorização nasce de auth.uid(), nunca de user_id enviado pelo navegador.
begin;
create schema if not exists help_private;
revoke all on schema help_private from public, anon, authenticated;
grant usage on schema help_private to authenticated;

create table public.help_profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null default 'Membro HELP' check(char_length(display_name) between 2 and 60),
 bio text not null default '' check(char_length(bio)<=280),
 city text not null default 'São Paulo' check(char_length(city)<=80),
 neighborhood text not null default '' check(char_length(neighborhood)<=80),
 status text not null default 'pending' check(status in ('pending','active','suspended')),
 created_at timestamptz not null default now()
);
create table public.help_wallets (
 user_id uuid primary key references public.help_profiles(id) on delete restrict,
 balance bigint not null default 0 check(balance between 0 and 1000000000),
 updated_at timestamptz not null default now()
);
create table help_private.operations (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.help_profiles(id),
 nonce uuid not null, kind text not null, amount bigint not null check(amount>0),
 target text not null, created_at timestamptz not null default now(), unique(actor_id,nonce)
);
create table public.help_ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.help_wallets(user_id),
 operation_id uuid not null references help_private.operations(id), type text not null,
 label text not null check(char_length(label)<=250), amount bigint not null check(amount<>0),
 created_at timestamptz not null default now(), unique(operation_id,user_id)
);
create index help_ledger_owner_date on public.help_ledger(user_id,created_at desc);
create index help_operations_actor_date on help_private.operations(actor_id,created_at desc);
create table public.help_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.help_profiles(id),
 item_id text not null check(char_length(item_id) between 1 and 100),
 title text not null check(char_length(title) between 1 and 160), provider text not null check(char_length(provider)<=100),
 category text not null check(char_length(category)<=60), price numeric(12,2) not null check(price between 0 and 1000000),
 note text not null default '' check(char_length(note)<=600), scheduled_at text not null default '' check(char_length(scheduled_at)<=100),
 status text not null default 'solicitado' check(status in ('solicitado','confirmado','a_caminho','concluido','cancelado')),
 -- O próprio membro NÃO pode aprovar a emissão de coins.
 reward_approved boolean not null default false,
 is_demo boolean not null default true check(is_demo), created_at timestamptz not null default now()
);
create index help_orders_owner on public.help_orders(user_id,created_at desc);
create table public.help_posts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.help_profiles(id),
 author text not null check(char_length(author) between 2 and 60),
 text text not null check(char_length(text) between 10 and 1000),
 kind text not null check(kind in ('help','offer','story')),
 category text not null check(char_length(category)<=60),
 reward integer not null default 0 check(reward between 0 and 5000), created_at timestamptz not null default now()
);
create index help_posts_date on public.help_posts(created_at desc);
create table public.help_likes (
 user_id uuid not null references public.help_profiles(id), post_id uuid not null references public.help_posts(id) on delete cascade,
 primary key(user_id,post_id)
);
create table public.help_comments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.help_profiles(id),
 post_id uuid not null references public.help_posts(id) on delete cascade,
 author text not null check(char_length(author) between 2 and 60), text text not null check(char_length(text) between 1 and 500),
 created_at timestamptz not null default now()
);
create index help_comments_post on public.help_comments(post_id,created_at);
create table public.help_favorites (
 user_id uuid not null references public.help_profiles(id), item_id text not null check(char_length(item_id) between 1 and 100),
 primary key(user_id,item_id)
);
create table public.help_feedback (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.help_profiles(id),
 rating integer not null check(rating between 1 and 5), text text not null check(char_length(text) between 5 and 1500),
 created_at timestamptz not null default now()
);
create table public.help_campaigns (
 id text primary key, title text not null, total bigint not null default 0 check(total>=0), active boolean not null default true
);
insert into public.help_campaigns(id,title) values ('food','Mesa cheia, bairro unido'),('learning','Conhecimento que aproxima'),('care','Cuidar também é ajudar');
create table public.help_donations (
 id uuid primary key references help_private.operations(id), user_id uuid not null references public.help_profiles(id),
 campaign_id text not null references public.help_campaigns(id), amount bigint not null check(amount>0),created_at timestamptz not null default now()
);
create table public.help_redemptions (
 id uuid primary key references help_private.operations(id), user_id uuid not null references public.help_profiles(id),
 reward_id text not null check(reward_id in ('delivery','service','pioneer')), title text not null, cost integer not null check(cost>0),
 code uuid not null default gen_random_uuid() unique, created_at timestamptz not null default now()
);
create table public.help_mission_claims (
 user_id uuid not null references public.help_profiles(id), mission_id text not null check(mission_id in ('welcome','profile','community','order')),
 operation_id uuid not null references help_private.operations(id), primary key(user_id,mission_id)
);

-- Perfil e carteira são criados pelo Auth; metadata nunca define permissões.
create function help_private.bootstrap_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.help_profiles(id,display_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),60),''),'Membro HELP'));
 insert into public.help_wallets(user_id) values(new.id);
 return new;
end $$;
create trigger help_create_member after insert on auth.users for each row execute function help_private.bootstrap_user();

create function help_private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.help_profiles p join auth.users u on u.id=p.id
 where p.id=(select auth.uid()) and p.status='active' and u.email_confirmed_at is not null)
$$;
create function help_private.require_member(require_mfa boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid();
begin
 if who is null or not help_private.is_member() then raise exception 'Conta não autorizada para o piloto.' using errcode='42501';end if;
 if require_mfa and coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'Confirme o segundo fator antes de movimentar HELP.' using errcode='42501';end if;
 return who;
end $$;

-- Permissões negativas por padrão: só concedemos as colunas e operações necessárias.
do $$ declare t text;begin
 foreach t in array array['help_profiles','help_wallets','help_ledger','help_orders','help_posts','help_likes','help_comments','help_favorites','help_feedback','help_campaigns','help_donations','help_redemptions','help_mission_claims'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy help_profile_read on public.help_profiles for select to authenticated using(id=(select auth.uid()));
create policy help_profile_edit on public.help_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
grant update(display_name,bio,city,neighborhood) on public.help_profiles to authenticated;
create policy help_wallet_read on public.help_wallets for select to authenticated using(user_id=(select auth.uid()));
create policy help_ledger_read on public.help_ledger for select to authenticated using(user_id=(select auth.uid()));
create policy help_orders_read on public.help_orders for select to authenticated using(user_id=(select auth.uid()));
create policy help_posts_read on public.help_posts for select to authenticated using(help_private.is_member());
create policy help_likes_read on public.help_likes for select to authenticated using(help_private.is_member());
create policy help_comments_read on public.help_comments for select to authenticated using(help_private.is_member());
create policy help_favorites_read on public.help_favorites for select to authenticated using(user_id=(select auth.uid()));
create policy help_feedback_read on public.help_feedback for select to authenticated using(user_id=(select auth.uid()));
create policy help_campaigns_read on public.help_campaigns for select to authenticated using(help_private.is_member() and active);
create policy help_donations_read on public.help_donations for select to authenticated using(user_id=(select auth.uid()));
create policy help_redemptions_read on public.help_redemptions for select to authenticated using(user_id=(select auth.uid()));
create policy help_missions_read on public.help_mission_claims for select to authenticated using(user_id=(select auth.uid()));
create policy help_favorite_add on public.help_favorites for insert to authenticated with check(user_id=(select auth.uid()) and help_private.is_member());
create policy help_favorite_remove on public.help_favorites for delete to authenticated using(user_id=(select auth.uid()) and help_private.is_member());
grant insert(user_id,item_id),delete on public.help_favorites to authenticated;

-- RPC de conteúdos: autor e dono sempre vêm da sessão, não do corpo da requisição.
create function public.help_publish(p_text text,p_kind text,p_category text,p_reward integer default 0) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member(); new_id uuid;
begin
 if (select count(*) from public.help_posts where user_id=who and created_at>now()-interval '1 hour')>=10 then raise exception 'Limite de publicações por hora atingido.';end if;
 insert into public.help_posts(user_id,author,text,kind,category,reward) select who,display_name,trim(p_text),p_kind,p_category,p_reward from public.help_profiles where id=who returning id into new_id;
 return new_id;
end $$;
create function public.help_comment(p_post uuid,p_text text) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();new_id uuid;
begin
 if (select count(*) from public.help_comments where user_id=who and created_at>now()-interval '1 hour')>=30 then raise exception 'Limite de comentários por hora atingido.';end if;
 insert into public.help_comments(user_id,post_id,author,text) select who,p_post,display_name,trim(p_text) from public.help_profiles where id=who returning id into new_id;return new_id;
end $$;
create function public.help_toggle_like(p_post uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();removed integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(who::text||p_post::text,0));
 delete from public.help_likes where user_id=who and post_id=p_post;get diagnostics removed=row_count;
 if removed=0 then insert into public.help_likes(user_id,post_id) values(who,p_post);return true;end if;return false;
end $$;
create function public.help_create_order(p_item text,p_title text,p_provider text,p_category text,p_price numeric,p_note text default '',p_schedule text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();new_id uuid;
begin
 if (select count(*) from public.help_orders where user_id=who and created_at>now()-interval '1 hour')>=20 then raise exception 'Limite de pedidos por hora atingido.';end if;
 insert into public.help_orders(user_id,item_id,title,provider,category,price,note,scheduled_at) values(who,p_item,p_title,p_provider,p_category,p_price,p_note,p_schedule) returning id into new_id;return new_id;
end $$;
create function public.help_advance_order(p_order uuid,p_cancel boolean default false) returns text language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();current_status text;next_status text;
begin
 select status into current_status from public.help_orders where id=p_order and user_id=who for update;
 if current_status is null then raise exception 'Pedido não encontrado.';end if;
 if current_status in ('concluido','cancelado') then raise exception 'Este pedido já foi encerrado.';end if;
 next_status:=case when p_cancel then 'cancelado' when current_status='solicitado' then 'confirmado' when current_status='confirmado' then 'a_caminho' else 'concluido' end;
 update public.help_orders set status=next_status where id=p_order;
 -- Concluir uma simulação NÃO emite saldo. A aprovação precisa ocorrer fora do cliente.
 return next_status;
end $$;
create function public.help_feedback(p_rating integer,p_text text) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();new_id uuid;
begin
 if (select count(*) from public.help_feedback where user_id=who and created_at>now()-interval '1 day')>=5 then raise exception 'Limite diário de opiniões atingido.';end if;
 insert into public.help_feedback(user_id,rating,text) values(who,p_rating,trim(p_text)) returning id into new_id;return new_id;
end $$;

-- Emissão limitada e única por missão; o navegador não escolhe o valor.
create function public.help_claim_mission(p_mission text) returns bigint language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member();credit integer;operation uuid;
begin
 perform 1 from public.help_wallets where user_id=who for update;
 if exists(select 1 from public.help_mission_claims where user_id=who and mission_id=p_mission) then raise exception 'Missão já resgatada.';end if;
 credit:=case p_mission when 'welcome' then 50 when 'profile' then 40 when 'community' then 30 when 'order' then 75 else 0 end;
 if credit=0 then raise exception 'Missão inválida.';end if;
 if p_mission='profile' and exists(select 1 from public.help_profiles where id=who and display_name='Membro HELP') then raise exception 'Complete seu nome no perfil.';end if;
 if p_mission='community' and not exists(select 1 from public.help_posts where user_id=who) then raise exception 'Publique na comunidade primeiro.';end if;
 if p_mission='order' and not exists(select 1 from public.help_orders where user_id=who and status='concluido' and reward_approved) then raise exception 'Esta missão precisa de validação da equipe.';end if;
 insert into help_private.operations(actor_id,nonce,kind,amount,target) values(who,gen_random_uuid(),'mission',credit,p_mission) returning id into operation;
 insert into public.help_mission_claims values(who,p_mission,operation);
 update public.help_wallets set balance=balance+credit,updated_at=now() where user_id=who;
 insert into public.help_ledger(user_id,operation_id,type,label,amount) values(who,operation,'mission','Missão HELP: '||p_mission,credit);
 return credit;
end $$;

-- Todas as saídas usam nonce idempotente, MFA, bloqueio de linha e limite diário.
-- A função fica em schema privado e NÃO é executável pelos clientes.
create function help_private.spend(p_kind text,p_amount bigint,p_target text,p_nonce uuid,p_label text) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member(true);operation uuid;old help_private.operations;available bigint;daily bigint;
begin
 if p_nonce is null or p_target is null or p_kind is null or p_amount is null or p_amount not between 1 and 1000 then raise exception 'Operação inválida; limite de 1.000 HELP.';end if;
 perform 1 from public.help_wallets where user_id=who for update;
 select * into old from help_private.operations where actor_id=who and nonce=p_nonce;
 if old.id is not null then
  if old.kind<>p_kind or old.amount<>p_amount or old.target<>p_target then raise exception 'Identificador reutilizado para operação diferente.';end if;
  return old.id;
 end if;
 select balance into available from public.help_wallets where user_id=who;
 select coalesce(sum(amount),0) into daily from help_private.operations where actor_id=who and kind in ('transfer','donation','redeem') and created_at>now()-interval '24 hours';
 if available<p_amount then raise exception 'Saldo insuficiente.';end if;
 if daily+p_amount>1000 then raise exception 'Limite de 1.000 HELP por 24 horas atingido.';end if;
 insert into help_private.operations(actor_id,nonce,kind,amount,target) values(who,p_nonce,p_kind,p_amount,p_target) returning id into operation;
 update public.help_wallets set balance=balance-p_amount,updated_at=now() where user_id=who;
 insert into public.help_ledger(user_id,operation_id,type,label,amount) values(who,operation,p_kind,p_label,-p_amount);
 return operation;
end $$;
create function public.help_transfer(p_recipient uuid,p_amount bigint,p_nonce uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member(true);operation uuid;
begin
 if p_recipient=who or not exists(select 1 from public.help_profiles where id=p_recipient and status='active') then raise exception 'Destinatário indisponível.';end if;
 -- Ordem fixa de bloqueio impede deadlocks em transferências simultâneas A↔B.
 perform 1 from public.help_wallets where user_id in (who,p_recipient) order by user_id for update;
 operation:=help_private.spend('transfer',p_amount,p_recipient::text,p_nonce,'Transferência HELP para '||p_recipient::text);
 if not exists(select 1 from public.help_ledger where operation_id=operation and user_id=p_recipient) then
  update public.help_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_recipient;
  insert into public.help_ledger(user_id,operation_id,type,label,amount) values(p_recipient,operation,'transfer','HELP recebido de outro membro',p_amount);
 end if;return operation;
end $$;
create function public.help_donate(p_campaign text,p_amount bigint,p_nonce uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member(true);operation uuid;
begin
 if not exists(select 1 from public.help_campaigns where id=p_campaign and active) then raise exception 'Campanha indisponível.';end if;
 operation:=help_private.spend('donation',p_amount,p_campaign,p_nonce,'Apoio à campanha: '||p_campaign);
 if not exists(select 1 from public.help_donations where id=operation) then
  insert into public.help_donations(id,user_id,campaign_id,amount) values(operation,who,p_campaign,p_amount);
  update public.help_campaigns set total=total+p_amount where id=p_campaign;
 end if;return operation;
end $$;
create function public.help_redeem(p_reward text,p_nonce uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid:=help_private.require_member(true);operation uuid;cost integer;title text;
begin
 cost:=case p_reward when 'delivery' then 100 when 'service' then 200 when 'pioneer' then 150 else 0 end;
 title:=case p_reward when 'delivery' then 'Entrega por nossa conta' when 'service' then 'Benefício no próximo serviço' else 'Selo Pioneiro HELP' end;
 if cost=0 then raise exception 'Benefício inválido.';end if;
 operation:=help_private.spend('redeem',cost,p_reward,p_nonce,'Benefício ilustrativo: '||title);
 insert into public.help_redemptions(id,user_id,reward_id,title,cost) values(operation,who,p_reward,title,cost) on conflict(id) do nothing;
 return operation;
end $$;

-- Ledger append-only: correções devem gerar lançamentos compensatórios, nunca apagar histórico.
create function help_private.immutable_ledger() returns trigger language plpgsql set search_path='' as $$begin raise exception 'O extrato é imutável.';end $$;
create trigger help_ledger_immutable before update or delete on public.help_ledger for each row execute function help_private.immutable_ledger();
revoke all on all tables in schema help_private from public,anon,authenticated;
revoke all on all functions in schema help_private from public,anon,authenticated;
grant execute on function help_private.is_member() to authenticated;
-- Revoga o EXECUTE público que PostgreSQL concede por padrão para novas funções.
do $$declare f record;begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'help\_%' escape '\' loop
 execute format('revoke all on function %s from public, anon, authenticated',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
comment on table public.help_wallets is 'Créditos ilustrativos do piloto, sem dinheiro real. Somente RPCs autorizadas alteram saldo.';
comment on table public.help_profiles is 'Perfil privado. status só pode ser alterado pela administração, nunca pelo membro.';
comment on table public.help_orders is 'Pedidos do catálogo demonstrativo. Conclusão pelo próprio membro não autoriza emissão de HELP.';
commit;
