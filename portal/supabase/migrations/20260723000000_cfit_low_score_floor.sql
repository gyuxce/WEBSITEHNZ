-- Backfill CFIT results whose raw score is below the lowest row in the
-- provided CFIT 3A norm table. The app now applies the same floor on submit.

update public.cfit_results
set
  iq = case norm_code
    when 'A1' then 63
    when 'A2' then 60
    when 'A3' then 57
    when 'A4' then 56
    when 'A5' then 55
    when 'A6' then 55
    else iq
  end,
  category = 'Memerlukan Pendampingan Intensif'
where iq is null
  and raw_total is not null
  and raw_total < 7
  and norm_code in ('A1', 'A2', 'A3', 'A4', 'A5', 'A6');
