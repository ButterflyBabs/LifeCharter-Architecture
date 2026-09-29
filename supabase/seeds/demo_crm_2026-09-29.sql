-- Demo account ("Demo — Brand Alchemy Studio") CRM sample data for the Sneak Peek, 2026-09-29.
-- Fictional people at example.com (never deliverable); the demo has no sending domain, so nothing is emailed.
-- Run once on the demo baseline, then select public.demo_snapshot_take() to make it the hourly-reset baseline.
do $seed$
declare
  d uuid := public.demo_plan_id();
  c record;
  cid uuid;
  f_quiz uuid; f_rsvp uuid;
  s_welcome uuid; s_launch uuid;
  st0 uuid; st1 uuid; st2 uuid;
  enr uuid;
  b_news uuid; b_party uuid;
  host uuid; cal uuid; list uuid;
  ids jsonb := '{}'::jsonb;
begin
  if d is null then raise exception 'demo plan not found'; end if;
  if exists (select 1 from seq_contacts where master_plan_id = d) then raise exception 'demo already has contacts'; end if;

  -- Custom fields
  insert into crm_custom_fields (master_plan_id, key, label, type, options, position) values
    (d, 'referred_by', 'Referred by', 'text', '{}', 1),
    (d, 'business_type', 'Business type', 'select', array['Coaching','Consulting','Wellness','Creative','Retail','Financial','Other'], 2);

  -- Contacts: (key, first, last, email, phone, company, title, city, region, relationships, tags, source, created, referred_by, business_type)
  for c in select * from (values
    ('priya','Priya','Shah','priya@example.com','303-555-0142','Shah Wellness','Founder','Boulder','CO',array['Prospect'],array['brand-quiz','newsletter','workshop-invite'],'form:brand-quiz','2026-09-08 15:12-06','Instagram','Wellness'),
    ('marcus','Marcus','Lee','marcus@example.com','720-555-0199','Lee Leadership Co.','Executive Coach','Denver','CO',array['Prospect'],array['podcast','discovery-call'],'manual','2026-09-15 10:40-06','Podcast guest spot','Coaching'),
    ('dana','Dana','Ortiz','dana@example.com',null,'Ortiz Consulting','Principal','Austin','TX',array['Prospect'],array['referral','discovery-call','workshop-invite'],'manual','2026-09-12 13:05-06','Jen Alvarez','Consulting'),
    ('jordan','Jordan','Harper','hello@example.com','303-555-0107','Harper & Co. Interiors','Creative Director','Golden','CO',array['Prospect'],array['masterclass','discovery-call'],'manual','2026-08-28 18:30-06','MasterClass','Creative'),
    ('nina','Nina','Brooks','nina@example.com','303-555-0163','Brooks Financial','Financial Planner','Littleton','CO',array['Prospect'],array['referral','proposal'],'manual','2026-08-20 09:15-06','Leah Kim','Financial'),
    ('sam','Sam','Rivera','sam@example.com',null,'Rivera Fitness','Owner','Denver','CO',array['Prospect'],array['website','proposal','newsletter'],'manual','2026-09-02 11:48-06','Website','Wellness'),
    ('leah','Leah','Kim','leah@example.com','720-555-0131','Kim Coaching','Life Coach','Denver','CO',array['Client'],array['masterclass','client','newsletter'],'manual','2026-07-30 16:20-06','MasterClass','Coaching'),
    ('tom','Tom','Becker','tom@example.com',null,'Becker Bakes','Owner','Fort Collins','CO',array['Prospect'],array['brand-quiz','newsletter'],'form:brand-quiz','2026-09-18 07:55-06','Instagram','Retail'),
    ('eloise','Eloise','Marchand','eloise@example.com','303-555-0188','Marchand Coaching','Leadership Coach','Denver','CO',array['Coach','Referral partner'],array['coach-network','workshop-invite','newsletter','launch-party'],'manual','2026-06-10 12:00-06',null,'Coaching'),
    ('grace','Grace','Okafor','grace@example.com',null,'Okafor Media','Podcast Host','Chicago','IL',array['Affiliate'],array['affiliate','workshop-invite'],'manual','2026-07-14 14:10-06',null,'Creative'),
    ('ben','Ben','Walsh','ben@example.com','720-555-0120','Walsh Photography','Photographer','Denver','CO',array['Vendor'],array['vendor'],'manual','2026-05-22 10:00-06',null,'Creative'),
    ('rosa','Rosa','Delgado','rosa@example.com',null,null,null,'Santa Fe','NM',array['Prospect'],array['brand-quiz','newsletter'],'form:brand-quiz','2026-09-24 19:22-06','Friend of Priya','Wellness')
  ) as v(k, fn, ln, em, ph, co, ti, city, reg, rels, tags, src, created, ref, bt) loop
    insert into seq_contacts (master_plan_id, email, first_name, last_name, phone, company, job_title, city, region, country, relationships, tags, source, tag_source, timezone, custom, created_at, updated_at, last_activity_at)
    values (d, c.em, c.fn, c.ln, c.ph, c.co, c.ti, c.city, c.reg, 'United States', c.rels, c.tags, c.src, c.src, 'America/Denver',
            jsonb_strip_nulls(jsonb_build_object('referred_by', c.ref, 'business_type', c.bt)), c.created::timestamptz, c.created::timestamptz, c.created::timestamptz)
    returning id into cid;
    ids := ids || jsonb_build_object(c.k, cid);
    -- Tag history: dated when each tag was really added (the trigger stamped "now").
    update crm_tag_history set created_at = c.created::timestamptz where contact_id = cid;
  end loop;

  -- Later tags get later dates and their own sources.
  update crm_tag_history set created_at = '2026-08-12 10:00-06', source = 'manual:alex@example.com' where contact_id = (ids->>'leah')::uuid and tag = 'client';
  update crm_tag_history set created_at = '2026-09-26 09:30-06', source = 'manual:alex@example.com' where tag = 'workshop-invite' and master_plan_id = d;
  update crm_tag_history set created_at = '2026-09-27 16:45-06', source = 'form:launch-party-rsvp' where contact_id = (ids->>'eloise')::uuid and tag = 'launch-party';
  update crm_tag_history set created_at = '2026-09-19 14:00-06', source = 'booking:brand-alchemy-discovery' where tag = 'discovery-call' and master_plan_id = d;
  update crm_tag_history set created_at = '2026-09-22 11:00-06', source = 'manual:alex@example.com' where tag = 'proposal' and master_plan_id = d;
  update seq_contacts set notes = null where master_plan_id = d;

  -- Forms
  insert into crm_forms (master_plan_id, key, name, description, fields, tags, sequence_key, notify, success_message, submit_label, active)
  values (d, 'brand-quiz', 'Brand Clarity Quiz', 'Five questions to see how clear your brand really is. Your results arrive by email.',
    '[{"name":"first_name","type":"text","label":"First name","required":true},{"name":"email","type":"email","label":"Email","required":true},{"name":"business","type":"text","label":"What does your business do?"},{"name":"stuck","type":"textarea","label":"Where does your brand feel unclear right now?"}]'::jsonb,
    array['brand-quiz','newsletter'], 'new-subscriber-welcome', true, 'Thank you! Your Brand Clarity results are on their way to your inbox.', 'Get my results', true)
  returning id into f_quiz;
  insert into crm_forms (master_plan_id, key, name, description, fields, tags, notify, success_message, submit_label, active)
  values (d, 'launch-party-rsvp', 'Brand Workshop Launch Party RSVP', 'Wednesday, October 15 · 5:30 to 7:00pm MT · Denver',
    '[{"name":"first_name","type":"text","label":"First name","required":true},{"name":"email","type":"email","label":"Email","required":true},{"name":"guest","type":"select","label":"Bringing a guest?","options":["Just me","Me + 1"]}]'::jsonb,
    array['launch-party'], true, 'You''re on the list! See you October 15.', 'Save my spot', true)
  returning id into f_rsvp;
  insert into crm_submissions (form_id, contact_id, data, page_url, created_at) values
    (f_quiz, (ids->>'priya')::uuid, '{"first_name":"Priya","email":"priya@example.com","business":"Holistic wellness studio","stuck":"I say too much and nobody remembers any of it."}', 'https://brandalchemy.example/quiz', '2026-09-08 15:12-06'),
    (f_quiz, (ids->>'tom')::uuid, '{"first_name":"Tom","email":"tom@example.com","business":"Neighborhood bakery","stuck":"Everyone knows the bread, nobody knows the name."}', 'https://brandalchemy.example/quiz', '2026-09-18 07:55-06'),
    (f_quiz, (ids->>'rosa')::uuid, '{"first_name":"Rosa","email":"rosa@example.com","business":"Starting a yoga retreat business","stuck":"I don''t know where to start."}', 'https://brandalchemy.example/quiz', '2026-09-24 19:22-06'),
    (f_rsvp, (ids->>'eloise')::uuid, '{"first_name":"Eloise","email":"eloise@example.com","guest":"Me + 1"}', 'https://brandalchemy.example/launch-party', '2026-09-27 16:45-06');

  -- Campaigns
  insert into sequences (master_plan_id, key, name, description, from_name, from_email, reply_to, brand, send_hour, active, notify_on_join, created_at)
  values (d, 'new-subscriber-welcome', 'New Subscriber Welcome', 'Three emails for everyone who takes the Brand Clarity Quiz.', 'Alex Morgan', '', 'alex@example.com', 'Brand Alchemy Studio', 8, true, true, '2026-07-01 09:00-06')
  returning id into s_welcome;
  insert into sequence_steps (sequence_id, position, day_offset, subject, preview, body, button_label, button_url) values
    (s_welcome, 0, 0, 'Your Brand Clarity results are here', 'Plus the one thing to fix first.', E'{{greeting}}\n\nThank you for taking the Brand Clarity Quiz! Here''s what your answers tell me.\n\n## Your biggest opportunity\nMost businesses don''t have a brand problem. They have a clarity problem: too many messages, not one clear promise.\n\nOver the next few days I''ll send you two short notes to help you find yours.', null, null)
    returning id into st0;
  insert into sequence_steps (sequence_id, position, day_offset, subject, preview, body, button_label, button_url) values
    (s_welcome, 1, 2, 'The one question every strong brand answers', 'It''s shorter than you think.', E'{{greeting}}\n\nEvery strong brand answers one question in a single sentence: **why you, for them, right now?**\n\nTry writing yours today. Keep it under 15 words.', null, null)
    returning id into st1;
  insert into sequence_steps (sequence_id, position, day_offset, subject, preview, body, button_label, button_url) values
    (s_welcome, 2, 5, 'Ready to find your brand''s voice?', 'Let''s talk it through, 30 minutes.', E'{{greeting}}\n\nIf your answer didn''t come easily, you''re in good company. That''s exactly what we work on together.\n\nBook a free Brand Discovery Call and we''ll find your one sentence together.', 'Book a Brand Discovery Call', 'https://lccommandsuite.com/book/brand-alchemy-discovery')
    returning id into st2;
  insert into sequences (master_plan_id, key, name, description, from_name, from_email, reply_to, brand, send_hour, active, created_at)
  values (d, 'workshop-launch', 'Brand Voice Workshop Launch', 'Four emails announcing the November Brand Voice Workshop. Turns on October 20.', 'Alex Morgan', '', 'alex@example.com', 'Brand Alchemy Studio', 9, false, '2026-09-20 10:00-06')
  returning id into s_launch;
  insert into sequence_steps (sequence_id, position, day_offset, subject, preview, body, button_label, button_url) values
    (s_launch, 0, 0, 'Doors are open: the Brand Voice Workshop', 'Two days that change how you talk about your work.', E'{{greeting}}\n\nThe Brand Voice Workshop is back for November.', 'Save my seat', 'https://brandalchemy.example/workshop'),
    (s_launch, 1, 3, 'What past guests said', 'Three stories from last spring.', E'{{greeting}}\n\nHere''s what three past guests took home.', null, null);

  -- People in the welcome campaign: finished, finished, part-way.
  for c in select * from (values ('priya','2026-09-08','completed','2026-09-08 15:12-06',3), ('tom','2026-09-18','completed','2026-09-18 07:55-06',3), ('rosa','2026-09-24','active','2026-09-24 19:22-06',2), ('leah','2026-07-30','completed','2026-07-30 16:20-06',3)) as v(k, start, status, at, n) loop
    insert into sequence_enrollments (sequence_id, contact_id, start_date, source, status, enrolled_at, completed_at, registered_at)
    values (s_welcome, (ids->>c.k)::uuid, c.start::date, case when c.k = 'leah' then 'manual' else 'form:brand-quiz' end, c.status, c.at::timestamptz,
            case when c.status = 'completed' then c.at::timestamptz + interval '5 days' end, null)
    returning id into enr;
    insert into sequence_sends (enrollment_id, step_id, status, sent_at)
      select enr, s.id, 'sent', c.at::timestamptz + (s.day_offset || ' days')::interval + interval '1 minute'
      from sequence_steps s where s.sequence_id = s_welcome and s.position < c.n;
  end loop;

  -- Broadcasts: one sent, one scheduled.
  insert into crm_broadcasts (master_plan_id, name, subject, preview, body, brand, from_name, from_email, reply_to, tags, tag_match, status, scheduled_at, timezone, queued_at, started_at, finished_at, recipient_count, created_at)
  values (d, 'September newsletter', 'Three brand myths I hear every week', 'And what to do instead.', E'{{greeting}}\n\nThis month: three brand myths, and what actually works.\n\n- **Myth 1:** you need a new logo\n- **Myth 2:** more posts means more clients\n- **Myth 3:** your brand is about you', 'Brand Alchemy Studio', 'Alex Morgan', '', 'alex@example.com',
          array['newsletter'], 'any', 'sent', '2026-09-22 09:00-06', 'America/Denver', '2026-09-22 09:00-06', '2026-09-22 09:00-06', '2026-09-22 09:02-06', 6, '2026-09-19 14:00-06')
  returning id into b_news;
  insert into crm_broadcast_sends (broadcast_id, contact_id, email, status, sent_at)
    select b_news, id, email, 'sent', '2026-09-22 09:01-06' from seq_contacts where master_plan_id = d and 'newsletter' = any(tags);
  insert into crm_broadcasts (master_plan_id, name, subject, preview, body, button_label, button_url, brand, from_name, from_email, reply_to, tags, tag_match, status, scheduled_at, timezone, created_at)
  values (d, 'Launch party invitation', 'You''re invited: Brand Workshop Launch Party (Oct 15)', 'An evening in Denver, and you''re on the list.', E'{{greeting}}\n\nYou''re invited to celebrate the new Brand Voice Workshop with us.\n\n**Wednesday, October 15 · 5:30 to 7:00pm MT · Denver**', 'Save my spot', 'https://lccommandsuite.com/f/' || f_rsvp, 'Brand Alchemy Studio', 'Alex Morgan', '', 'alex@example.com',
          array['workshop-invite'], 'any', 'scheduled', '2026-10-09 09:00-06', 'America/Denver', '2026-09-28 11:00-06')
  returning id into b_party;

  -- Booking calendar, host and bookings
  insert into booking_hosts (master_plan_id, name, email, timezone, weekly, active)
  values (d, 'Alex Morgan', 'alex@example.com', 'America/Denver', '{"mon":[["09:00","16:00"]],"tue":[["09:00","16:00"]],"wed":[["09:00","16:00"]],"thu":[["09:00","16:00"]]}'::jsonb, true)
  returning id into host;
  insert into booking_calendars (master_plan_id, slug, name, description, duration_min, slot_step_min, buffer_before_min, buffer_after_min, min_notice_hours, max_days_ahead, daily_cap, assignment, host_ids, location, location_detail, questions, tags, sequence_key, confirmation_note, active, create_deal, deal_value)
  values (d, 'brand-alchemy-discovery', 'Brand Discovery Call', 'A free 30-minute call to find the one sentence your brand needs.', 30, 30, 0, 15, 24, 30, 4, 'single', array[host], 'custom', 'Zoom (your link arrives in your confirmation email)',
          '[{"name":"business","type":"text","label":"What does your business do?","required":true},{"name":"win","type":"textarea","label":"What would make this call a win for you?"}]'::jsonb,
          array['discovery-call'], null, 'Come with one question you''d love answered.', true, true, 4500)
  returning id into cal;
  insert into bookings (master_plan_id, calendar_id, host_id, contact_id, start_at, end_at, invitee_name, invitee_email, invitee_timezone, answers, status, meeting_url, manage_token_hash, created_at) values
    (d, cal, host, (ids->>'jordan')::uuid, '2026-09-25 10:00-06', '2026-09-25 10:30-06', 'Jordan Harper', 'hello@example.com', 'America/Denver', '{"business":"Residential interior design","win":"A clear way to explain our process"}', 'completed', 'https://zoom.us/j/0000000001', md5(random()::text) || md5(random()::text), '2026-09-19 14:00-06'),
    (d, cal, host, (ids->>'marcus')::uuid, '2026-10-05 11:00-06', '2026-10-05 11:30-06', 'Marcus Lee', 'marcus@example.com', 'America/Denver', '{"business":"Executive coaching for new managers","win":"Knowing if the Intensive fits"}', 'confirmed', 'https://zoom.us/j/0000000002', md5(random()::text) || md5(random()::text), '2026-09-19 14:00-06'),
    (d, cal, host, (ids->>'dana')::uuid, '2026-10-07 14:00-06', '2026-10-07 14:30-06', 'Dana Ortiz', 'dana@example.com', 'America/Denver', '{"business":"Operations consulting","win":"A name and a message I''m proud of"}', 'confirmed', 'https://zoom.us/j/0000000003', md5(random()::text) || md5(random()::text), '2026-09-19 14:00-06');

  -- Invite list for the launch party
  insert into crm_invite_lists (master_plan_id, name, form_id, invite_tag, invite_tags, created_at)
  values (d, 'Brand Workshop Launch Party (Oct 15)', f_rsvp, 'workshop-invite', array['workshop-invite'], '2026-09-26 09:00-06')
  returning id into list;
  insert into crm_invites (list_id, master_plan_id, contact_id, email, sent_at) values
    (list, d, (ids->>'eloise')::uuid, 'eloise@example.com', '2026-09-26 10:05-06'),
    (list, d, (ids->>'dana')::uuid, 'dana@example.com', '2026-09-26 10:07-06'),
    (list, d, (ids->>'grace')::uuid, 'grace@example.com', '2026-09-27 08:30-06');

  -- Timelines
  insert into crm_events (master_plan_id, contact_id, kind, title, detail, created_at) values
    (d, (ids->>'priya')::uuid, 'form', 'Submitted “Brand Clarity Quiz”', '{"form":"brand-quiz","data":{"business":"Holistic wellness studio","stuck":"I say too much and nobody remembers any of it."}}', '2026-09-08 15:12-06'),
    (d, (ids->>'priya')::uuid, 'sequence', 'Started “New Subscriber Welcome”', '{"sequence":"new-subscriber-welcome"}', '2026-09-08 15:12-06'),
    (d, (ids->>'priya')::uuid, 'note', 'Loved the quiz results. Interested in the Brand Voice Workshop in November. Follow up after launch party.', '{}', '2026-09-16 13:30-06'),
    (d, (ids->>'tom')::uuid, 'form', 'Submitted “Brand Clarity Quiz”', '{"form":"brand-quiz","data":{"business":"Neighborhood bakery","stuck":"Everyone knows the bread, nobody knows the name."}}', '2026-09-18 07:55-06'),
    (d, (ids->>'tom')::uuid, 'sequence', 'Started “New Subscriber Welcome”', '{"sequence":"new-subscriber-welcome"}', '2026-09-18 07:55-06'),
    (d, (ids->>'rosa')::uuid, 'form', 'Submitted “Brand Clarity Quiz”', '{"form":"brand-quiz","data":{"business":"Starting a yoga retreat business","stuck":"I don''t know where to start."}}', '2026-09-24 19:22-06'),
    (d, (ids->>'rosa')::uuid, 'sequence', 'Started “New Subscriber Welcome”', '{"sequence":"new-subscriber-welcome"}', '2026-09-24 19:22-06'),
    (d, (ids->>'jordan')::uuid, 'booking', 'Booked Brand Discovery Call for Thu Sep 25, 10:00am MT', '{}', '2026-09-19 14:00-06'),
    (d, (ids->>'jordan')::uuid, 'booking', 'Attended Brand Discovery Call', '{}', '2026-09-25 10:35-06'),
    (d, (ids->>'jordan')::uuid, 'note', 'Great call. Wants the Signature Brand Build for the spring relaunch. Sending proposal next week.', '{}', '2026-09-25 10:50-06'),
    (d, (ids->>'marcus')::uuid, 'note', 'Met on the Lead With Heart podcast. Curious about the Intensive for his new-manager program.', '{}', '2026-09-15 10:40-06'),
    (d, (ids->>'marcus')::uuid, 'booking', 'Booked Brand Discovery Call for Mon Oct 5, 11:00am MT', '{}', '2026-09-19 14:00-06'),
    (d, (ids->>'dana')::uuid, 'note', 'Referred by Jen Alvarez. Rebranding her consulting firm this quarter.', '{}', '2026-09-12 13:05-06'),
    (d, (ids->>'dana')::uuid, 'booking', 'Booked Brand Discovery Call for Wed Oct 7, 2:00pm MT', '{}', '2026-09-19 14:00-06'),
    (d, (ids->>'nina')::uuid, 'note', 'Proposal sent for the Signature Brand Build. Decision expected by Oct 10.', '{}', '2026-09-22 11:00-06'),
    (d, (ids->>'sam')::uuid, 'note', 'Proposal sent for the Brand Alchemy Intensive. Asked about a January start.', '{}', '2026-09-22 11:05-06'),
    (d, (ids->>'leah')::uuid, 'purchase', 'Purchased Brand Alchemy Intensive', '{}', '2026-08-12 10:00-06'),
    (d, (ids->>'leah')::uuid, 'note', 'Intensive complete! Wrote a lovely testimonial. Ask about the Monthly Brand Partner in October.', '{}', '2026-09-10 15:00-06'),
    (d, (ids->>'eloise')::uuid, 'note', 'Coaching colleague. Sends 2 to 3 referrals a quarter. Coffee on the first Friday of each month.', '{}', '2026-06-10 12:00-06'),
    (d, (ids->>'eloise')::uuid, 'form', 'Submitted “Brand Workshop Launch Party RSVP”', '{"form":"launch-party-rsvp","data":{"guest":"Me + 1"}}', '2026-09-27 16:45-06'),
    (d, (ids->>'grace')::uuid, 'note', 'Affiliate for the Brand Voice Workshop (15%). Featured us on her podcast in August.', '{}', '2026-07-14 14:10-06'),
    (d, (ids->>'ben')::uuid, 'note', 'Brand photography partner. Books 3 weeks out.', '{}', '2026-05-22 10:00-06');

  -- Latest activity per contact
  update seq_contacts s set last_activity_at = coalesce((select max(created_at) from crm_events e where e.contact_id = s.id), s.created_at) where s.master_plan_id = d;
end $seed$;
