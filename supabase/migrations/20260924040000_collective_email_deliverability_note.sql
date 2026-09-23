-- Tell members where the Collective's first emails may land (welcome post + FAQ).
update public.cm_posts set body = replace(body, E'\n\nHOW WE SHOW UP\n',
  E'\n\nMAKE SURE OUR EMAILS REACH YOU\nThe Collective emails you about announcements, replies and messages you haven''t seen yet, from community@lccommandsuite.com. Your first few may land in Other (Outlook), Promotions (Gmail) or Spam. If you find one there, move it to your main inbox and mark it "Not spam" — that teaches your inbox to deliver the next ones where you''ll see them.\n\nHOW WE SHOW UP\n')
where title like 'Welcome — here%' and body not like '%MAKE SURE OUR EMAILS REACH YOU%';
update public.cm_faqs set answer = answer || E'\n\nNot seeing our emails? They come from community@lccommandsuite.com — check Other (Outlook), Promotions (Gmail) and Spam, and mark the first one "Not spam" so the rest reach your inbox.', updated_at = now()
where question like 'I''m not getting notifications%' and answer not like '%community@lccommandsuite.com%';
