-- Endurecimento de padrões futuros. Aplicar depois da primeira migração.
begin;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter table help_private.operations enable row level security;
alter table help_private.operations force row level security;
-- A aprovação administrativa tem um teto transacional de 100 membros ativos.
create function help_private.pilot_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='active' and old.status<>'active' then
  perform pg_advisory_xact_lock(10020261030);
  if (select count(*) from public.help_profiles where status='active')>=100 then raise exception 'O piloto está limitado a 100 membros ativos.';end if;
 end if;return new;
end $$;
revoke all on function help_private.pilot_limit() from public,anon,authenticated;
create trigger help_pilot_limit before update of status on public.help_profiles for each row execute function help_private.pilot_limit();
commit;
