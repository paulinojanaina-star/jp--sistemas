ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS document_url TEXT;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('movement-attachments', 'movement-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'movement-attachments');

CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'movement-attachments');

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'movement-attachments');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'movement-attachments');
