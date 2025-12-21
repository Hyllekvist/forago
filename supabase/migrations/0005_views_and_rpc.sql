-- Optional view for public aggregated feed stats (future)
create or replace view public.v_species_season_dk as
select
  s.slug,
  t.name,
  se.month_from,
  se.month_to,
  se.confidence
from public.species s
join public.species_translations t on t.species_id = s.id and t.locale='dk'
left join public.seasonality se on se.species_id = s.id and se.country='dk';
