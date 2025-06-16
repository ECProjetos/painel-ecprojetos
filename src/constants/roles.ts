export const roles = {
    colaborador: "COLABORADOR",
    gestor:       "GESTOR",
    diretor:      "DIRETOR",
}

// 1) Manual
export const rolesList = [
    { label: "Colaborador", value: roles.colaborador },
    { label: "Gestor",       value: roles.gestor },
    { label: "Diretor",      value: roles.diretor },
]

// 2) Dinâmico
export type RoleOption = { label: string; value: string }

export const rolesListDynamic: RoleOption[] = Object.entries(roles).map(
    ([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value,
    })
)