-- COPIA Y PEGA ESTO EN EL SQL EDITOR DE SUPABASE:

CREATE TABLE IF NOT EXISTS public.portfolios_v2 (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar acceso (Para pruebas, desactiva RLS o crea una política)
ALTER TABLE public.portfolios_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.portfolios_v2
    FOR ALL
    USING (true)
    WITH CHECK (true);
