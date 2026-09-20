-- Migración Fase 1: Agregar columna opening_cash a la tabla public.shifts
-- Permite registrar e inmutabilizar el fondo inicial de caja al abrir un turno.

ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS opening_cash numeric(12,2) DEFAULT 0.00;

COMMENT ON COLUMN public.shifts.opening_cash IS 'Fondo inicial de caja entregado al cajero al abrir el turno';

-- Notificar recarga de caché a PostgREST
NOTIFY pgrst, 'reload schema';
