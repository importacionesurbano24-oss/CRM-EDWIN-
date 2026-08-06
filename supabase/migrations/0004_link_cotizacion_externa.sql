-- PasoCRM — link a cotización externa en cada seguimiento
-- Edwin genera muchas cotizaciones en otra herramienta (no en el módulo
-- Cotizaciones de PasoCRM). Este campo le permite anexar esa URL al
-- registrar el seguimiento, para tenerla a mano y para que el agente de
-- IA la lea como contexto al sugerir la próxima acción.

alter table public.seguimientos
add column if not exists link_cotizacion text;

comment on column public.seguimientos.link_cotizacion is 'URL opcional a una cotización creada en otra herramienta (no el módulo Cotizaciones interno).';
