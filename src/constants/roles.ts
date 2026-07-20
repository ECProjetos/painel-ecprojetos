export const roles = {
    colaborador: "COLABORADOR",
    lider: "LIDER",
    gestor: "GESTOR",
    diretor: "DIRETOR",
  } as const
  
  export type RoleValue = (typeof roles)[keyof typeof roles]
  
  export const roleLabels: Record<RoleValue, string> = {
    COLABORADOR: "Colaborador",
    LIDER: "Líder",
    GESTOR: "Gestor",
    DIRETOR: "Diretor",
  }
  
  export type RoleOption = {
    label: string
    value: RoleValue
  }
  
  export const rolesList: RoleOption[] = Object.values(roles).map((value) => ({
    label: roleLabels[value],
    value,
  }))
  
  export const rolesListDynamic = rolesList