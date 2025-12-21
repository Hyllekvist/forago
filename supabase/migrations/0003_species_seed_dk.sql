insert into public.species (slug, default_name, safety_level)
values
  ('ramsons', 'Ramsløg', 'warn'),
  ('chanterelle', 'Kantarel', 'good'),
  ('elderflower', 'Hyldeblomst', 'good')
on conflict (slug) do nothing;

-- DK translations
insert into public.species_translations (species_id, locale, name, description, traits, lookalikes, how_to_use)
select
  s.id,
  'dk',
  s.default_name,
  'Demo-indhold. Udfyld med sikre identifikationstræk, forvekslinger og brug.',
  jsonb_build_object('traits', jsonb_build_array('Trait A','Trait B','Trait C')),
  jsonb_build_array(
    jsonb_build_object('name','Forveksling A','risk','bad','note','Poisonous in some cases'),
    jsonb_build_object('name','Forveksling B','risk','warn','note','Common confusion')
  ),
  jsonb_build_array('Use 1','Use 2')
from public.species s
where s.slug in ('ramsons','chanterelle','elderflower')
on conflict (species_id, locale) do nothing;
