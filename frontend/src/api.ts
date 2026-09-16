export interface Workspace { id: number; name: string; createdAt: string; updatedAt: string }
export interface Todo { id: number; workspaceId: number; title: string; completed: boolean; createdAt: string; updatedAt: string }
const base = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333/api' : '/api')).replace(/\/$/, '')
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try { response = await fetch(`${base}${path}`, { ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, signal: AbortSignal.timeout(15000) }) }
  catch { throw new Error('Cannot reach the server. Check your connection and try again.') }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(response.status >= 500 ? 'Something went wrong on the server. Please try again.' : error.message || 'Unable to save your changes.')
  }
  return response.status === 204 ? undefined as T : response.json()
}
export const api = {
  listWorkspaces: () => request<{ data: Workspace[] }>('/workspaces'),
  createWorkspace: (name: string) => request<{ data: Workspace }>('/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
  updateWorkspace: (id: number, name: string) => request<{ data: Workspace }>(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  removeWorkspace: (id: number) => request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
  list: (workspaceId?: number) => request<{ data: Todo[] }>(`/todos${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  create: (title: string, workspaceId: number) => request<{ data: Todo }>('/todos', { method: 'POST', body: JSON.stringify({ title, workspaceId }) }),
  update: (id: number, data: Partial<Pick<Todo, 'title' | 'completed'>>) => request<{ data: Todo }>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' }),
}
