// enum status para projetos 
export const STATUS_PROJECT = {
    ACTIVE: { value: 'ativo', label: 'Ativo' },
    INACTIVE: { value: 'inativo', label: 'Inativo' },
    PAUSED: { value: 'pausado', label: 'Pausado' },
} as const;

export type StatusValue = typeof STATUS_PROJECT[keyof typeof STATUS_PROJECT]['value'];

export const STATUS_OPTIONS = Object.values(STATUS_PROJECT).map(({ value, label }) => ({
    value,
    label,
})) as ReadonlyArray<{ value: StatusValue; label: string }>;
