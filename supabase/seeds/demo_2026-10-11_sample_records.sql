-- Demo account (Brand Alchemy Studio): sample records for Short Links, Testimonials, Meta Lead Ads and the
-- Prospect Qualifier, so those pages are not empty in a demo or in product screenshots. Demo-only: every row is
-- keyed to public.demo_plan_id(). Safe to re-run (clears these tables for the demo plan first).
--
-- Run order (the hourly demo_reset() restores from demo_snapshot, so the snapshot must be re-taken):
--   1. select public.demo_reset();      -- drops any visitor-added rows so they are not baked in
--   2. run this file
--   3. select public.demo_snapshot_take();
-- Dates are written relative to now(); demo_roll_dates() keeps them current from then on.
-- No secret is created for meta_lead_settings on purpose: the demo shows a placeholder address, never a live one.
do $$
declare
  v uuid := public.demo_plan_id();
  v_offer uuid := '34b37751-f3aa-45c3-9a4a-998cbb795f54';  -- Brand Alchemy Intensive
  v_icp uuid := gen_random_uuid();
  v_aud uuid := gen_random_uuid();
  v_req1 uuid := gen_random_uuid();
begin
  if v is null then raise exception 'demo plan not found'; end if;

  delete from short_link_clicks where master_plan_id = v;
  delete from short_links where master_plan_id = v;
  delete from testimonials where master_plan_id = v;
  delete from review_requests where master_plan_id = v;
  delete from meta_leads where master_plan_id = v;
  delete from icp_qualifications where master_plan_id = v;
  delete from icp_audiences where master_plan_id = v;
  delete from icp_profiles where master_plan_id = v;

  -- Short links
  insert into short_links (master_plan_id, code, destination_url, title, active, click_count, created_at, updated_at) values
    (v, 'ba-voice',    'https://example.com/brand-voice-workshop',            'Brand Voice Workshop: sign-up page',      true,  86, now() - interval '19 days', now() - interval '2 days'),
    (v, 'ba-call',     'https://example.com/book/brand-alchemy-discovery',    'Free 30-minute discovery call',           true,  41, now() - interval '16 days', now() - interval '1 day'),
    (v, 'ba-podcast',  'https://example.com/podcast-guest-kit',               'Podcast guest kit (for hosts)',           true,  23, now() - interval '11 days', now() - interval '3 days'),
    (v, 'ba-ig',       'https://example.com/free-brand-audit',                'Instagram bio: free brand audit',         true, 152, now() - interval '30 days', now() - interval '4 hours'),
    (v, 'ba-summer',   'https://example.com/summer-intensive-waitlist',       'Summer Intensive waitlist (closed)',      false, 64, now() - interval '48 days', now() - interval '21 days');

  -- Testimonials and review requests
  insert into review_requests (id, master_plan_id, token, client_name, client_email, program, from_name, message, status, opened_at, completed_at, created_at) values
    (v_req1, v, md5(random()::text || clock_timestamp()::text), 'Tamara Reyes', 'tamara@example.com', 'Brand Alchemy Intensive', 'Eloise Marchand', 'Would you share a few words about the Intensive?', 'completed', now() - interval '9 days', now() - interval '9 days', now() - interval '10 days'),
    (gen_random_uuid(), v, md5(random()::text || clock_timestamp()::text), 'Jordan Whitfield', 'jordan@example.com', 'Signature Brand Build', 'Eloise Marchand', 'Would you share a few words about the Build?', 'opened', now() - interval '1 day', null, now() - interval '3 days'),
    (gen_random_uuid(), v, md5(random()::text || clock_timestamp()::text), 'Leah Brandt', 'leah@example.com', 'Brand Voice Workshop', 'Eloise Marchand', 'Would you share a few words about the Workshop?', 'sent', null, null, now() - interval '1 day');

  insert into testimonials (master_plan_id, request_id, client_name, client_email, program, rating, type, headline, content, status, consent, source, shares, created_at, updated_at) values
    (v, v_req1, 'Tamara Reyes', 'tamara@example.com', 'Brand Alchemy Intensive', 5, 'text',
      'I finally sound like myself',
      'Two half-days and I walked away with a positioning statement I can say out loud without wincing. My website copy took an afternoon after that. Three of my last four discovery calls quoted my own words back to me.',
      'featured', true, 'collected', 6, now() - interval '9 days', now() - interval '8 days'),
    (v, null, 'Jordan Whitfield', 'jordan@example.com', 'Signature Brand Build', 5, 'text',
      'Worth every week of the ten',
      'The brand identity, the copy and the launch kit all felt like one voice. My referrals started repeating the new one-liner back to me within a month.',
      'approved', true, 'manual', 2, now() - interval '24 days', now() - interval '23 days'),
    (v, null, 'Leah Brandt', 'leah@example.com', 'Brand Voice Workshop', 5, 'text',
      'Three hours that saved me three months',
      'I came in with a messy About page and left with a voice worksheet I use on every post. The replay was a bonus.',
      'approved', true, 'collected', 1, now() - interval '31 days', now() - interval '30 days'),
    (v, null, 'Sam Park', 'sam@example.com', 'Monthly Brand Partner', 4, 'text',
      'Steady and honest',
      'The monthly check-in keeps my messaging from drifting. I would like a few more templates, but the feedback is always straight.',
      'pending', true, 'collected', 0, now() - interval '2 days', now() - interval '2 days');

  -- Meta lead ads: what has arrived through the lead form
  insert into meta_leads (master_plan_id, email, name, ad_name, form_name, answers, status, detail, created_at) values
    (v, 'maya.ellis@example.com',   'Maya Ellis',    'Free Brand Audit: carousel', 'Free brand audit form', '{"business":"Ellis Pilates","website":"ellispilates.example.com"}', 'saved', 'Saved to Contacts', now() - interval '3 hours'),
    (v, 'chris.tanaka@example.com', 'Chris Tanaka',  'Free Brand Audit: carousel', 'Free brand audit form', '{"business":"Tanaka Tax Studio","website":"tanakatax.example.com"}', 'saved', 'Saved to Contacts', now() - interval '9 hours'),
    (v, 'rosa.mendez@example.com',  'Rosa Mendez',   'Brand Voice Workshop: reel', 'Workshop waitlist form', '{"business":"Rosa Mendez Coaching"}', 'saved', 'Saved to Contacts', now() - interval '1 day 4 hours'),
    (v, 'ben.carter@example.com',   'Ben Carter',    'Free Brand Audit: carousel', 'Free brand audit form', '{"business":"Carter Home Design"}', 'saved', 'Saved to Contacts', now() - interval '2 days 2 hours'),
    (v, 'amara.nwosu@example.com',  'Amara Nwosu',   'Brand Voice Workshop: reel', 'Workshop waitlist form', '{"business":"Nwosu Wellness"}', 'saved', 'Saved to Contacts', now() - interval '3 days 6 hours'),
    (v, 'lee.parker@example.com',   'Lee Parker',    'Free Brand Audit: carousel', 'Free brand audit form', '{}', 'skipped', 'Previously unsubscribed', now() - interval '4 days'),
    (v, 'test.lead@example.com',    'Test Lead',     'Free Brand Audit: carousel', 'Free brand audit form', '{}', 'test', 'Meta test lead, ignored', now() - interval '6 days');

  -- Prospect Qualifier: one Ideal Client Profile, one scored list, two full qualifications
  insert into icp_profiles (id, master_plan_id, name, offer_id, who_serve, help_do, signature_offer, core_problem, already_has, missing, red_flags, levels, sort_order, created_at, updated_at) values
    (v_icp, v, 'Brand Alchemy Intensive: ideal client', v_offer,
      'Founder-led service businesses (coaches, consultants, designers) doing $150K to $600K a year with a team of one to three.',
      'Name what the brand stands for, then turn it into a positioning statement, a voice guide and copy that sells.',
      'Brand Alchemy Intensive: two half-day strategy sessions and 30 days of support.',
      'They are excellent at the work but their website and posts sound like everyone else''s, so referrals stay their only way in.',
      E'Paying clients and happy referrals\nA website and a social presence\nA service they can describe in a sentence\nBudget for a $4,500 project',
      E'A clear positioning statement\nA voice that is unmistakably theirs\nCopy that converts a cold visitor',
      E'Large agency or corporate employee\nLooking for a logo only\nNo existing clients or revenue\nDormant: nothing posted in 6+ months',
      $j$[
        {"name":"Invisible","signs":"Few or no clients yet\nNo website or a placeholder page\nPosts rarely, no clear offer","ideal":false},
        {"name":"Sounds like everyone","signs":"Steady clients, mostly by referral\nWebsite exists but reads generic\nPosts consistently with little response\nCannot say what makes them different","ideal":true},
        {"name":"Almost there","signs":"Clear offer and a distinct voice in places\nSome conversion on the website\nNeeds polish, not a rebuild","ideal":false},
        {"name":"Established","signs":"Strong brand and authority\nSteady inbound\nAlready works with a brand strategist","ideal":false}
      ]$j$::jsonb,
      0, now() - interval '14 days', now() - interval '14 days');

  insert into icp_audiences (id, master_plan_id, icp_id, name, total, created_at) values
    (v_aud, v, v_icp, 'Podcast guest list: October', 8, now() - interval '5 days');

  insert into icp_qualifications (master_plan_id, icp_id, icp_name, kind, audience_id, name, platform, profile_url, email, source_text, fit, level, priority, result, created_at) values
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Aisha Cole', 'LI', 'https://www.linkedin.com/in/example-aisha-cole', 'aisha@example.com',
      E'Headline: Founder at Cole Wellness Studio\nCompany: Cole Wellness Studio\nIndustry: Health and wellness\nLocation: Austin, TX', 'YES', 'Sounds like everyone', 'HIGH',
      $j${"reason":"Founder of her own wellness studio, a service business of about the right size.","likelyLevel":"Sounds like everyone","facts":"Headline: Founder at Cole Wellness Studio\nCompany: Cole Wellness Studio\nIndustry: Health and wellness\nLocation: Austin, TX"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Marcus Webb', 'LI', 'https://www.linkedin.com/in/example-marcus-webb', 'marcus@example.com',
      E'Headline: Leadership coach for first-time managers\nCompany: Webb Leadership\nIndustry: Professional coaching\nLocation: Denver, CO', 'YES', 'Sounds like everyone', 'HIGH',
      $j${"reason":"Runs his own coaching practice and sells to managers, which is the audience this offer serves.","likelyLevel":"Sounds like everyone","facts":"Headline: Leadership coach for first-time managers\nCompany: Webb Leadership\nIndustry: Professional coaching\nLocation: Denver, CO"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Priyanka Rao', 'LI', 'https://www.linkedin.com/in/example-priyanka-rao', 'priyanka@example.com',
      E'Headline: Interior designer | Residential and boutique hospitality\nCompany: Rao Interiors\nIndustry: Design\nLocation: Chicago, IL', 'YES', 'Almost there', 'HIGH',
      $j${"reason":"Owner of a small design studio with a clear niche; likely needs voice and copy more than a rebuild.","likelyLevel":"Almost there","facts":"Headline: Interior designer | Residential and boutique hospitality\nCompany: Rao Interiors\nIndustry: Design\nLocation: Chicago, IL"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Tom Fischer', 'LI', 'https://www.linkedin.com/in/example-tom-fischer', 'tom@example.com',
      E'Headline: Business consultant\nCompany: Self-employed\nIndustry: Consulting\nLocation: Portland, OR', 'BORDERLINE', 'Can''t tell from a list', 'MEDIUM',
      $j${"reason":"Self-employed consultant, but the headline gives no niche or audience to judge by.","likelyLevel":"Can't tell from a list","facts":"Headline: Business consultant\nCompany: Self-employed\nIndustry: Consulting\nLocation: Portland, OR"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Hannah Boyd', 'LI', 'https://www.linkedin.com/in/example-hannah-boyd', 'hannah@example.com',
      E'Headline: Photographer for founders and small teams\nCompany: Boyd Studio\nIndustry: Photography\nLocation: Nashville, TN', 'BORDERLINE', 'Almost there', 'MEDIUM',
      $j${"reason":"Photographer who already serves founders; may want a brand partner more than a strategy intensive.","likelyLevel":"Almost there","facts":"Headline: Photographer for founders and small teams\nCompany: Boyd Studio\nIndustry: Photography\nLocation: Nashville, TN"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Elena Park', 'LI', 'https://www.linkedin.com/in/example-elena-park', 'elena@example.com',
      E'Headline: Brand strategist and creative director\nCompany: Park & Co.\nIndustry: Marketing and advertising\nLocation: New York, NY', 'BORDERLINE', 'Established', 'LOW',
      $j${"reason":"A brand strategist herself: a peer or referral partner, not a buyer.","likelyLevel":"Established","facts":"Headline: Brand strategist and creative director\nCompany: Park & Co.\nIndustry: Marketing and advertising\nLocation: New York, NY"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'David Kim', 'LI', 'https://www.linkedin.com/in/example-david-kim', 'david@example.com',
      E'Headline: Senior Marketing Manager\nCompany: Northline Corporation (4,200 employees)\nIndustry: Manufacturing\nLocation: Columbus, OH', 'NO', 'Wrong ICP', 'SKIP',
      $j${"reason":"Employed at a large corporation, not a founder-led business.","likelyLevel":"Wrong ICP","facts":"Headline: Senior Marketing Manager\nCompany: Northline Corporation (4,200 employees)\nIndustry: Manufacturing\nLocation: Columbus, OH"}$j$::jsonb, now() - interval '5 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'audience', v_aud, 'Rachel Stone', 'LI', 'https://www.linkedin.com/in/example-rachel-stone', 'rachel@example.com',
      E'Headline: Open to work | Recent graduate\nCompany: (none)\nIndustry: Marketing\nLocation: Boston, MA', 'NO', 'Wrong ICP', 'SKIP',
      $j${"reason":"Looking for employment with no business of her own yet.","likelyLevel":"Wrong ICP","facts":"Headline: Open to work | Recent graduate\nCompany: (none)\nIndustry: Marketing\nLocation: Boston, MA"}$j$::jsonb, now() - interval '5 days');

  insert into icp_qualifications (master_plan_id, icp_id, icp_name, kind, name, platform, profile_url, source_text, fit, level, priority, dm_angle, result, created_at) values
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'profile', 'Camille Duarte', 'IG', 'https://www.instagram.com/example.camille.duarte',
      'Camille Duarte. Founder, Duarte Skin Studio. Licensed esthetician, 9 years. Posts three times a week. Bio: "Skin that feels like you." Link in bio goes to a booking page. Recent post: "People say my facials are the best thing they have ever done and then book somewhere cheaper. What am I missing?"',
      'YES', 'Sounds like everyone', 'HIGH',
      'Camille, your post about clients loving the facials and then booking somewhere cheaper stayed with me. I recognise that gap. When someone loves the work but cannot say why you in particular, what do they usually say when you ask?',
      $j${"name":"Camille Duarte","headline":"Founder, Duarte Skin Studio","about":"Licensed esthetician running her own studio for nine years.","location":"Not visible in what was pasted","company":"Duarte Skin Studio","audience":"Not visible in what was pasted","credentials":"Licensed esthetician, 9 years in practice",
        "content":{"topics":"Skin care, client results","frequency":"Three posts a week","engagement":"Not visible in what was pasted","postTypes":"Photos and short captions"},
        "offer":{"visible":"soft","details":"Booking page in bio; no lead magnet or named offer"},
        "observation":"She is established and consistent, and her own post names the problem: clients love the work but price-shop. The bio promises a feeling, not a result, so nothing separates her from any other studio.",
        "fit":"YES","fitReason":"Owner of a service business who has named the exact gap this offer closes.",
        "level":"Sounds like everyone","levelEvidence":["Posts three times a week, consistently","Nine years in practice, clear credentials","Bio is generic: \"Skin that feels like you\"","Her own post asks what she is missing"],
        "gap":"A positioning statement that explains why clients should choose her studio over a cheaper one.",
        "dmAngle":"Camille, your post about clients loving the facials and then booking somewhere cheaper stayed with me. I recognise that gap. When someone loves the work but cannot say why you in particular, what do they usually say when you ask?",
        "priority":"HIGH","priorityReason":"Ideal profile, and she asked the question publicly this week.","warmSignal":"",
        "fast":{"headline":"Clear title, generic promise","posts":"Consistent, three a week","engagement":"Not visible","offer":"Booking link only","bottomLine":"Strong credentials with no positioning: reach out this week."}}$j$::jsonb,
      now() - interval '2 days'),
    (v, v_icp, 'Brand Alchemy Intensive: ideal client', 'profile', 'Owen Briggs', 'LI', 'https://www.linkedin.com/in/example-owen-briggs',
      'Owen Briggs. Fractional CFO for startups. Posts about twice a month. Headline: "Helping founders understand their numbers." About page lists services but no named offer. Few comments on posts.',
      'BORDERLINE', 'Almost there', 'MEDIUM',
      'Owen, the way you explain cash runway in plain language is rare. What do founders tend to ask you first when they finally sit down with their numbers?',
      $j${"name":"Owen Briggs","headline":"Fractional CFO for startups","about":"Helps founders understand their numbers.","location":"Not visible in what was pasted","company":"Not visible in what was pasted","audience":"Not visible in what was pasted","credentials":"Fractional CFO",
        "content":{"topics":"Cash flow, startup finance","frequency":"About twice a month","engagement":"Few comments","postTypes":"Text posts"},
        "offer":{"visible":"soft","details":"Services listed, no named offer"},
        "observation":"A clear niche and plain-language voice, but posting is sparse and the offer is a list of services rather than one named thing. Could be closer to ready than the activity suggests.",
        "fit":"BORDERLINE","fitReason":"Own practice and a clear niche, but little visible activity to judge the gap by.",
        "level":"Almost there","levelEvidence":["Clear niche in the headline","Posts about twice a month","Services listed with no named offer","Little engagement"],
        "gap":"A named, packaged offer and a steadier voice in public.",
        "dmAngle":"Owen, the way you explain cash runway in plain language is rare. What do founders tend to ask you first when they finally sit down with their numbers?",
        "priority":"MEDIUM","priorityReason":"Fits, but engage with his posts for a week or two before reaching out.","warmSignal":"",
        "fast":{"headline":"Clear niche","posts":"Sparse","engagement":"Low","offer":"Services list","bottomLine":"Nurture first, then a warm message."}}$j$::jsonb,
      now() - interval '4 days');
end $$;
