insert into public.seasonality (species_id, country, month_from, month_to, confidence, notes)
select s.id, 'dk', 4, 6, 4, 'Spring window'
from public.species s where s.slug='ramsons'
on conflict do nothing;

insert into public.seasonality (species_id, country, month_from, month_to, confidence, notes)
select s.id, 'dk', 7, 10, 4, 'Summer-autumn'
from public.species s where s.slug='chanterelle'
on conflict do nothing;

insert into public.seasonality (species_id, country, month_from, month_to, confidence, notes)
select s.id, 'dk', 6, 7, 3, 'Early summer'
from public.species s where s.slug='elderflower'
on conflict do nothing;
