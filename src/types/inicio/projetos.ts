import { z } from "zod";

export const projectsSchema = z.object({
 id: z.number().int().positive(), // serial not null
  name: z.string().max(150), // character varying(150) not null
  code: z.string().max(50).nullable(), // character varying(50) null
  estimated_hours: z.number().int().nullable(), // integer null
  description: z.string().nullable(), // text null
  status: z.enum(["ativo", "inativo", "concluido", "pausado"]),
});

export type ProjectType = z.infer<typeof projectsSchema>;
export const projectsArraySchema = z.array(projectsSchema);
export type ProjectsType = z.infer<typeof projectsArraySchema>
