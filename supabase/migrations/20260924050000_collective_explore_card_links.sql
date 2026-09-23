-- Explore cards for programs without a sales page open a private message to
-- the founding admin with a note ready to send ("dm:" + note).
update public.cm_discover_cards d set cta_label = 'Learn more',
  cta_url = case s.slug
    when 'lifecharter-program' then 'dm:Hi AmiLynne, I''d like to hear about the LifeCharter Program.'
    when 'command-suite' then 'dm:Hi AmiLynne, I''d like to hear about the LifeCharter Command Suite.'
  end
from public.cm_spaces s
where s.id = d.space_id and s.slug in ('lifecharter-program', 'command-suite');
