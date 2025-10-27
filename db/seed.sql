INSERT INTO public.config(key, value) VALUES
  ('app.name', '{"service":"lastmetro-api","version":"1.0.0"}'),
  ('metro.defaults', '{"line":"M1","headwayMin":5,"timezone":"Europe/Paris"}'),
  ('station.chatelet', '{"name":"Châtelet","lines":["M1","M4","M7","M11","M14"],"lastMetro":"00:40"}')
ON CONFLICT (key) DO NOTHING;