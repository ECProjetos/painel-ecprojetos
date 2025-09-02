'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type NodeType = 'macroprocesso' | 'processo' | 'subprocesso' | 'atividade';



export type ActivityNode = {
  id: string;
  type: NodeType;
  name: string;
  parent: string | null;
  completed?: boolean;
  expanded?: boolean;       // só se for macro/processo/subprocesso
  selected?: boolean;       // só para atividade, mas manter no tipo ajuda
  children?: ActivityNode[];
};

type Filters = {
  macro?: string;
  processo?: string;
  subprocesso?: string;
};

type Props = {
  data: ActivityNode[];
};

function cloneDeep<T>(obj: T): T {
  return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

// util: percorre profundamente
function walk(node: ActivityNode, fn: (n: ActivityNode) => void) {
  fn(node);
  node.children?.forEach((c) => walk(c, fn));
}

// util: encontra por id
function findById(nodes: ActivityNode[], id: string): ActivityNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// util: caminho hierárquico por nomes [macro, processo, subprocesso, atividade?]
function getHierarchyPath(node: ActivityNode, root: ActivityNode[]): string[] {
  const path: string[] = [];
  let current: ActivityNode | null = node;
  // precisamos conseguir o parent; busque no root por id
  // aqui criamos um helper interno que consegue o nó-pai dado o id
  const getParent = (child: ActivityNode): ActivityNode | null => {
    // busca DFS e retorna pai
    const stack: ActivityNode[] = [...root];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.children?.some((c) => c.id === child.id)) return cur;
      if (cur.children) stack.push(...cur.children);
    }
    return null;
  };

  while (current) {
    path.unshift(current.name);
    if (!current.parent) break;
    const parent = getParent(current);
    current = parent;
  }
  return path;
}

// util: lista todas as atividades filhas
function collectChildActivities(node: ActivityNode): ActivityNode[] {
  const out: ActivityNode[] = [];
  walk(node, (n) => {
    if (n.type === 'atividade') out.push(n);
  });
  return out;
}

// aplica filtros preservando a hierarquia
function filterTree(
  nodes: ActivityNode[],
  filters: Filters,
  root: ActivityNode[]
): ActivityNode[] {
  const matchNode = (n: ActivityNode): boolean => {
    const path = getHierarchyPath(n, root);
    const [macro, processo, subprocesso] = [path[0], path[1], path[2]];
    if (filters.macro && macro !== filters.macro) return false;
    if (filters.processo && processo !== filters.processo) return false;
    if (filters.subprocesso && subprocesso !== filters.subprocesso) return false;
    return true;
  };

  const recur = (arr: ActivityNode[]): ActivityNode[] =>
    arr
      .map((n) => {
        const children = n.children ? recur(n.children) : undefined;
        const selfMatches = matchNode(n);
        const childMatches = (children?.length ?? 0) > 0;
        if (selfMatches || childMatches) {
          return { ...n, children };
        }
        return null;
      })
      .filter(Boolean) as ActivityNode[];

  return recur(nodes);
}

// deduz opções de filtros (macro/processo/sub) do conjunto atual
function deriveFilterOptions(nodes: ActivityNode[], root: ActivityNode[]) {
  const macros = new Set<string>();
  const processos = new Set<string>();
  const subprocessos = new Set<string>();

  const stack: ActivityNode[] = [...nodes];
  while (stack.length) {
    const n = stack.pop()!;
    const path = getHierarchyPath(n, root);
    if (path[0]) macros.add(path[0]);
    if (path[1]) processos.add(path[1]);
    if (path[2]) subprocessos.add(path[2]);
    if (n.children) stack.push(...n.children);
  }

  return {
    macros: Array.from(macros).sort(),
    processos: Array.from(processos).sort(),
    subprocessos: Array.from(subprocessos).sort(),
  };
}

export default function ProjectActivityTable({ data }: Props) {
  // estado raiz (imutável) e uma cópia mutável para UI
  const [tree, setTree] = useState<ActivityNode[]>(() => {
    const d = cloneDeep(data);
    d.forEach((n) => walk(n, (x) => {
      if (x.type === 'atividade' && typeof x.selected !== 'boolean') x.selected = false;
      if (x.type !== 'atividade' && typeof x.expanded !== 'boolean') x.expanded = true;
    }));
    return d;
  });

  const [filters, setFilters] = useState<Filters>({});
  const [visibleTree, setVisibleTree] = useState<ActivityNode[]>(tree);

  // opções dos selects
  const filterOptions = useMemo(
    () => deriveFilterOptions(tree, tree),
    [tree]
  );

  // ref para o checkbox “selecionar todos”
  const selectAllRef = useRef<HTMLInputElement>(null);

  // aplica filtros a cada mudança
  useEffect(() => {
    setVisibleTree(filterTree(tree, filters, tree));
  }, [tree, filters]);

  // flatten útil para contagens e selecionar tudo
  const flatActivities = useMemo(() => {
    const out: ActivityNode[] = [];
    tree.forEach((n) => walk(n, (x) => { if (x.type === 'atividade') out.push(x); }));
    return out;
  }, [tree]);

  const selectedCount = flatActivities.filter((a) => a.selected).length;
  const totalActivities = flatActivities.length;

  // indeterminate do “selecionar todos”
  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedCount > 0 && selectedCount < totalActivities;
    if (selectedCount === totalActivities) {
      selectAllRef.current.checked = true;
    } else if (selectedCount === 0) {
      selectAllRef.current.checked = false;
    }
  }, [selectedCount, totalActivities]);

  // ações
  const toggleExpand = (id: string) => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      const node = findById(draft, id);
      if (node && node.type !== 'atividade') node.expanded = !node.expanded;
      return draft;
    });
  };

  const toggleActivitySelection = (id: string) => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      const node = findById(draft, id);
      if (node && node.type === 'atividade') node.selected = !node.selected;
      return draft;
    });
  };

  const toggleGroupSelection = (id: string) => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      const node = findById(draft, id);
      if (!node) return prev;
      const acts = collectChildActivities(node);
      const selected = acts.filter((a) => a.selected).length;
      const shouldSelect = selected < acts.length;
      acts.forEach((a) => (a.selected = shouldSelect));
      return draft;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      draft.forEach((n) =>
        walk(n, (x) => {
          if (x.type === 'atividade') x.selected = checked;
        })
      );
      return draft;
    });
  };

  const selectAllVisible = () => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      const visibles = filterTree(prev, filters, prev);
      // marque somente atividades visíveis
      const markVisibleActivities = (arr: ActivityNode[]) => {
        arr.forEach((n) => {
          if (n.type === 'atividade') {
            const real = findById(draft, n.id);
            if (real) real.selected = true;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          n.children && markVisibleActivities(n.children);
        });
      };
      markVisibleActivities(visibles);
      return draft;
    });
  };

  const deselectAllVisible = () => {
    setTree((prev) => {
      const draft = cloneDeep(prev);
      const visibles = filterTree(prev, filters, prev);
      const unmark = (arr: ActivityNode[]) => {
        arr.forEach((n) => {
          if (n.type === 'atividade') {
            const real = findById(draft, n.id);
            if (real) real.selected = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          n.children && unmark(n.children);
        });
      };
      unmark(visibles);
      return draft;
    });
  };

  const clearFilters = () => setFilters({});

  // render
  const renderRows = (nodes: ActivityNode[]) =>
    nodes.map((n) => {

      // estado do checkbox de grupo (para macro/processo/sub)
      let groupChecked = false;
      let groupIndeterminate = false;
      if (n.type !== 'atividade') {
        const acts = collectChildActivities(n);
        const sel = acts.filter((a) => a.selected).length;
        groupChecked = acts.length > 0 && sel === acts.length;
        groupIndeterminate = sel > 0 && sel < acts.length;
      }

      return (
        <React.Fragment key={n.id}>
          <tr className={`hover:bg-gray-50 row-${n.type}`} data-id={n.id} data-type={n.type}>
            {/* checkbox */}
            <td className="px-4 py-4 whitespace-nowrap">
              {n.type === 'atividade' ? (
                <input
                  type="checkbox"
                  className="checkbox-custom activity-checkbox"
                  checked={!!n.selected}
                  onChange={() => toggleActivitySelection(n.id)}
                />
              ) : (
                <GroupCheckbox
                  checked={groupChecked}
                  indeterminate={groupIndeterminate}
                  onChange={() => toggleGroupSelection(n.id)}
                />
              )}
            </td>

            {/* Macroprocesso */}
            <td className="px-4 py-4 text-sm text-gray-900">
              {n.type === 'macroprocesso' ? (
                <div className="flex items-center">
                  <button
                    onClick={() => toggleExpand(n.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                    aria-label={n.expanded ? 'Recolher' : 'Expandir'}
                  >
                    {n.expanded ? '▼' : '▶'}
                  </button>
                  <span className="font-semibold text-blue-800">{n.name}</span>
                </div>
              ) : null}
            </td>

            {/* Processo */}
            <td className="px-4 py-4 text-sm text-gray-900">
              {n.type === 'processo' ? (
                <div className="flex items-center">
                  <button
                    onClick={() => toggleExpand(n.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                    aria-label={n.expanded ? 'Recolher' : 'Expandir'}
                  >
                    {n.expanded ? '▼' : '▶'}
                  </button>
                  <span className="font-semibold text-green-800">{n.name}</span>
                </div>
              ) : null}
            </td>

            {/* Subprocesso */}
            <td className="px-4 py-4 text-sm text-gray-900">
              {n.type === 'subprocesso' ? (
                <div className="flex items-center">
                  <button
                    onClick={() => toggleExpand(n.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                    aria-label={n.expanded ? 'Recolher' : 'Expandir'}
                  >
                    {n.expanded ? '▼' : '▶'}
                  </button>
                  <span className="font-semibold text-yellow-800">{n.name}</span>
                </div>
              ) : null}
            </td>

            {/* Atividade */}
            <td className="px-4 py-4 text-sm text-gray-900">
              {n.type === 'atividade' ? (
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{n.name}</span>
                  {n.completed ? <span className="ml-2 text-green-600">✓</span> : null}
                </div>
              ) : null}
            </td>
          </tr>

          {/* filhos */}
          {n.expanded && n.children?.length ? renderRows(n.children) : null}
        </React.Fragment>
      );
    });

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Atividades do Projeto</h1>
        <p className="text-gray-600">Gerencie e acompanhe o progresso das atividades organizadas por hierarquia</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Macroprocesso</label>
            <select
              value={filters.macro ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, macro: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {filterOptions.macros.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Processo</label>
            <select
              value={filters.processo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, processo: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {filterOptions.processos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subprocesso</label>
            <select
              value={filters.subprocesso ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, subprocesso: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {filterOptions.subprocessos.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Limpar Filtros
          </button>
          <div className="flex gap-2">
            <button
              onClick={selectAllVisible}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Selecionar Todas Visíveis
            </button>
            <button
              onClick={deselectAllVisible}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Desselecionar Todas Visíveis
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="checkbox-custom"
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Macroprocesso
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subprocesso
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atividade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">{renderRows(visibleTree)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Checkbox de grupo com estado indeterminate controlado por prop
function GroupCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="checkbox-custom group-checkbox"
      checked={checked}
      onChange={onChange}
    />
  );
}
