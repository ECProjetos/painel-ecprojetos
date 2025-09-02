import ProjectActivityTable from '@/app/(private)/teste-tabela/test';

import { ActivityNode } from '@/app/(private)/teste-tabela/test';

export const projectData: ActivityNode[] = [
  {
    id: 'mp1',
    type: 'macroprocesso',
    name: 'Gestão de Vendas',
    parent: null,
    completed: false,
    expanded: true,
    children: [
      {
        id: 'p1',
        type: 'processo',
        name: 'Prospecção de Clientes',
        parent: 'mp1',
        completed: false,
        expanded: true,
        children: [
          {
            id: 'sp1',
            type: 'subprocesso',
            name: 'Identificação de Leads',
            parent: 'p1',
            completed: false,
            expanded: true,
            children: [
              { id: 'a1', type: 'atividade', name: 'Pesquisar empresas no LinkedIn Sales Navigator', parent: 'sp1', completed: true },
              { id: 'a2', type: 'atividade', name: 'Analisar base de dados do CRM', parent: 'sp1', completed: true },
              // ... cole o restante do seu JSON aqui, sem mudar a estrutura
            ],
          },
          // ...
        ],
      },
      // ...
    ],
  },
  // mp2, mp3, mp4, mp5...
];


export default function Page() {
  return <ProjectActivityTable data={projectData} />;
}
