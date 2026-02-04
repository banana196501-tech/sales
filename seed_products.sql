-- Seed Data for Honda Products
-- For Nusantara Sakti Group Sales CRM

-- Ensure the products table exists (if not already created by schema)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert Honda Products
INSERT INTO public.products (name, description) VALUES
('Honda Beat', 'Skutik Kecil - Lincah dan irit untuk penggunaan harian.'),
('Honda Beat Street', 'Skutik Kecil - Gaya street dengan stang telanjang.'),
('Honda Genio', 'Skutik Kecil - Desain casual dan stylish.'),
('Honda Vario 125', 'Skutik Menengah - Performa handal untuk harian.'),
('Honda Vario 160', 'Skutik Menengah - Sporty dengan mesin bertenaga 160cc.'),
('Honda Scoopy', 'Skutik Menengah - Ikonik dengan desain retro modern.'),
('Honda Stylo 160', 'Skutik Menengah - Retro modern dengan performa tinggi.'),
('Honda PCX 160', 'Skutik Besar - Mewah dan nyaman untuk jarak jauh.'),
('Honda ADV 160', 'Skutik Adventure - Tangguh untuk berbagai medan.'),
('Honda Forza 250', 'Skutik Premium - Performa dan fitur kasta tertinggi.'),
('Honda Supra X 125', 'Bebek - Legendaris dan irit bahan bakar.'),
('Honda Revo', 'Bebek - Fungsional dan ekonomis.'),
('Honda Supra GTR 150', 'Bebek Sport - Performa mesin 150cc yang agresif.'),
('Honda Sonic 150R', 'Bebek Sport - Light Agility Sport untuk anak muda.'),
('Honda CBR150R', 'Sport Fairing - DNA balap untuk penggunaan harian.'),
('Honda CBR250RR', 'Sport Fairing - Total Control dengan mesin 2 silinder.'),
('Honda CB150R StreetFire', 'Naked Sport - Agresif dan lincah di kemacetan.'),
('Honda CB150X', 'Adv-Tourer - Desain adventure yang gagah.'),
('Honda Rebel', 'Cruiser - Gaya klasik Amerika yang ikonik.'),
('Honda Rebel 1100', 'Cruiser - Performa besar dengan kenyamanan maksimal.'),
('Honda CRF150L', 'Off-Road - Dual purpose untuk segala medan.'),
('Honda CRF250 Rally', 'Off-Road - Desain terinspirasi reli Dakar.'),
('Honda EM1 e:', 'Electric - Motor listrik pertama untuk masa depan.')
ON CONFLICT (name) DO NOTHING;
