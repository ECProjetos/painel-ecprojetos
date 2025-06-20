// enum status para projetos 
export const STATUS_PROJECT = {
    ACTIVE: { value: 'ativo', label: 'Ativo' },
    INACTIVE: { value: 'inativo', label: 'Inativo' },
    PAUSED: { value: 'pausado', label: 'Pausado' },
    COMPLETED: { value: 'concluido', label: 'Concluído' }
} as const;

export type StatusValue = typeof STATUS_PROJECT[keyof typeof STATUS_PROJECT]['value'];

export const STATUS_OPTIONS = Object.values(STATUS_PROJECT).map(({ value, label }) => ({
    value,
    label,
})) as ReadonlyArray<{ value: StatusValue; label: string }>;

// enum status para atividades
export const STATUS_ACTIVITY = {
    ACTIVE: { value: 'ativo', label: 'Ativo' },
    INACTIVE: { value: 'inativo', label: 'Inativo' },
} as const;

export type ActivityStatusValue = typeof STATUS_ACTIVITY[keyof typeof STATUS_ACTIVITY]['value'];

export const ACTIVITY_STATUS_OPTIONS = Object.values(STATUS_ACTIVITY).map(({ value, label }) => ({
    value,
    label,
})) as ReadonlyArray<{ value: ActivityStatusValue; label: string }>;

