alter table public.method_steps
    drop constraint if exists method_steps_icon_check;

alter table public.method_steps
    add constraint method_steps_icon_check
    check (
        icon is null
        or icon = any (
            array[
                'phone',
                'message',
                'ear',
                'question',
                'presentation',
                'handshake',
                'users',
                'search',
                'target',
                'compass',
                'lightbulb',
                'brain',
                'pen',
                'plan',
                'calendar',
                'clock',
                'send',
                'repeat',
                'flag',
                'briefcase',
                'euro',
                'scale',
                'puzzle',
                'shield',
                'check',
                'gauge',
                'trophy',
                'zap'
            ]
        )
    ) not valid;

alter table public.method_steps
    validate constraint method_steps_icon_check;
