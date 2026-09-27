-- Quick Pulse check-ins create action steps; allow them as a source.
alter table public.client_action_items drop constraint client_action_items_source_type_check;
alter table public.client_action_items add constraint client_action_items_source_type_check
  check (source_type = any (array['brain_assessment','soul_assessment','profit_assessment','insight','coach','client','quick_pulse']));
