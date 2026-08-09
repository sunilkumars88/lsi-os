export interface WorkflowNode {
  id: string;
  type: string;
  label?: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export function validateDag(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set(nodes.map((n) => n.id));

  for (const edge of edges) {
    if (!ids.has(edge.from)) errors.push(`Edge from unknown node: ${edge.from}`);
    if (!ids.has(edge.to)) errors.push(`Edge to unknown node: ${edge.to}`);
    if (edge.from === edge.to) errors.push(`Self-loop on node: ${edge.from}`);
  }

  const adj = new Map<string, string[]>();
  for (const id of ids) adj.set(id, []);
  for (const edge of edges) {
    adj.get(edge.from)?.push(edge.to);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (node: string): boolean => {
    if (stack.has(node)) {
      errors.push(`Cycle detected at node: ${node}`);
      return true;
    }
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const next of adj.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    stack.delete(node);
    return false;
  };

  for (const id of ids) dfs(id);

  const hasIncoming = new Set(edges.map((e) => e.to));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  if (roots.length === 0 && nodes.length > 0) {
    errors.push('Workflow must have at least one root node');
  }

  return { valid: errors.length === 0, errors };
}

export function topologicalOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    adj.get(e.from)?.push(e.to);
  }

  const queue = [...inDegree.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id);
  const order: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adj.get(node) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  return order;
}
