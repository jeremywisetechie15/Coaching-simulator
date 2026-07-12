alter table public.personas
    add column if not exists net_income_before_tax text;

comment on column public.personas.net_income_before_tax is
    'Optional persona net income before income tax, including any user-provided currency or period.';
