-- Vocabulary: what the database calls spaces are "channels" to members, and
-- what it calls channels are "pathways". Table names are unchanged; this
-- migration updates member-facing wording that lives in the database.

create or replace function public.cm_join_public_space(p_space uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not cm_in_collective() then raise exception 'not a member'; end if;
  if not exists (select 1 from cm_spaces where id = p_space and visibility = 'public' and not archived) then
    raise exception 'That channel needs an invite code.';
  end if;
  insert into cm_space_members (space_id, user_id, joined_via)
  values (p_space, auth.uid(), 'public') on conflict do nothing;
end $$;
revoke all on function public.cm_join_public_space(uuid) from public, anon;
grant execute on function public.cm_join_public_space(uuid) to authenticated;

insert into public.cm_faqs (category, question, answer, sort_order)
select 'Getting started', 'What''s the difference between a channel and a pathway?',
 E'Channels are the main areas of the Collective — Start Here, The Commons, and a private channel for each LifeCharter program you''re in.\n\nPathways are the conversations inside a channel. In The Commons, for example, Wins & Aligned Action and Ask the Collective are pathways. Each pathway has one purpose, so it''s easy to know where to post.', 25
where not exists (select 1 from public.cm_faqs where question like 'What''s the difference between a channel and a pathway%');

update public.cm_posts set body = replace(body,
  'Here''s how to find your way around.',
  E'Here''s how to find your way around.\n\nThe Collective is made of channels — like Start Here, The Commons, and the channel for each program you''re in. Each channel has pathways, and each pathway is for a particular kind of conversation.')
where title like 'Welcome — here%' and body not like '%made of channels%';
