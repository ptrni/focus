import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CheckCheck, ChevronRight, Circle, ClipboardList, Folder, Inbox, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { api, type Todo, type Workspace } from './api'

type Filter = 'all' | 'active' | 'completed'
const filters: { id: Filter; label: string; icon: typeof Inbox }[] = [
  { id: 'all', label: 'All tasks', icon: Inbox },
  { id: 'active', label: 'Active', icon: Circle },
  { id: 'completed', label: 'Completed', icon: CheckCheck },
]
const savedWorkspaceId = () => Number(localStorage.getItem('focus.workspaceId')) || null

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(savedWorkspaceId)
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [workspaceBusy, setWorkspaceBusy] = useState<number[]>([])
  const [editingWorkspace, setEditingWorkspace] = useState<number | null>(null)
  const [workspaceDraft, setWorkspaceDraft] = useState('')
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)
  const [busy, setBusy] = useState<number[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [deleting, setDeleting] = useState<Todo | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const workspaceDialog = useRef<HTMLDialogElement>(null)
  const done = todos.filter(t => t.completed).length
  const active = todos.length - done
  const activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId)
  const visible = todos.filter(t => (filter === 'all' || (filter === 'completed' ? t.completed : !t.completed)) && t.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  async function load(nextWorkspaceId = activeWorkspaceId) {
    setLoading(true); setError(''); setLoadFailed(false)
    try {
      const workspaceResult = await api.listWorkspaces()
      setWorkspaces(workspaceResult.data)
      const selected = workspaceResult.data.find(workspace => workspace.id === nextWorkspaceId)?.id ?? workspaceResult.data[0]?.id ?? null
      setActiveWorkspaceId(selected)
      if (selected) localStorage.setItem('focus.workspaceId', String(selected))
      setTodos(selected ? (await api.list(selected)).data : [])
    }
    catch (e) { setError((e as Error).message); setLoadFailed(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => { if (deleting) dialog.current?.showModal(); else dialog.current?.close() }, [deleting])
  useEffect(() => { if (deletingWorkspace) workspaceDialog.current?.showModal(); else workspaceDialog.current?.close() }, [deletingWorkspace])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer) }, [notice])
  async function add(e: FormEvent) {
    e.preventDefault(); if (!title.trim() || adding || !activeWorkspaceId) return
    setAdding(true); setError('')
    try { const task = (await api.create(title.trim(), activeWorkspaceId)).data; setTodos(prev => [task, ...prev]); setTitle(''); setFilter('all'); setQuery(''); setNotice('Task added') }
    catch (e) { setError((e as Error).message) }
    finally { setAdding(false); input.current?.focus() }
  }
  async function createWorkspace(e: FormEvent) {
    e.preventDefault(); if (!workspaceName.trim() || creatingWorkspace) return
    setCreatingWorkspace(true); setError('')
    try {
      const workspace = (await api.createWorkspace(workspaceName.trim())).data
      setWorkspaces(prev => [...prev, workspace])
      setWorkspaceName('')
      setFilter('all')
      setQuery('')
      await load(workspace.id)
      setNotice('Workspace created')
    } catch (e) { setError((e as Error).message) }
    finally { setCreatingWorkspace(false) }
  }
  async function selectWorkspace(id: number) {
    setActiveWorkspaceId(id); setFilter('all'); setQuery(''); setEditing(null); setError('')
    localStorage.setItem('focus.workspaceId', String(id))
    try { setLoading(true); setTodos((await api.list(id)).data) }
    catch (e) { setError((e as Error).message); setLoadFailed(true) }
    finally { setLoading(false) }
  }
  async function renameWorkspace(e: FormEvent, workspace: Workspace) {
    e.preventDefault(); if (!workspaceDraft.trim() || workspaceBusy.includes(workspace.id)) return
    setWorkspaceBusy(prev => [...prev, workspace.id]); setError('')
    try {
      const updated = (await api.updateWorkspace(workspace.id, workspaceDraft.trim())).data
      setWorkspaces(prev => prev.map(item => item.id === updated.id ? updated : item))
      setEditingWorkspace(null)
      setNotice('Workspace updated')
    } catch (e) { setError((e as Error).message) }
    finally { setWorkspaceBusy(prev => prev.filter(id => id !== workspace.id)) }
  }
  async function removeWorkspace() {
    if (!deletingWorkspace) return
    const id = deletingWorkspace.id
    setWorkspaceBusy(prev => [...prev, id]); setError('')
    try {
      await api.removeWorkspace(id)
      setDeletingWorkspace(null)
      const remaining = workspaces.filter(workspace => workspace.id !== id)
      setWorkspaces(remaining)
      const next = remaining[0]?.id ?? null
      if (next) {
        await selectWorkspace(next)
      } else {
        localStorage.removeItem('focus.workspaceId')
        setActiveWorkspaceId(null)
        setTodos([])
      }
      setNotice('Workspace deleted')
    } catch (e) { setDeletingWorkspace(null); setError((e as Error).message) }
    finally { setWorkspaceBusy(prev => prev.filter(value => value !== id)) }
  }
  async function update(todo: Todo, changes: Partial<Pick<Todo, 'title' | 'completed'>>) {
    setBusy(prev => [...prev, todo.id]); setError('')
    try { const task = (await api.update(todo.id, changes)).data; setTodos(prev => prev.map(t => t.id === task.id ? task : t)); if ('title' in changes) setEditing(null); setNotice('Task updated') }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(prev => prev.filter(id => id !== todo.id)) }
  }
  async function remove() {
    if (!deleting) return
    const id = deleting.id; setBusy(prev => [...prev, id]); setError('')
    try { await api.remove(id); setTodos(prev => prev.filter(t => t.id !== id)); setDeleting(null); setNotice('Task deleted') }
    catch (e) { setDeleting(null); setError((e as Error).message) }
    finally { setBusy(prev => prev.filter(value => value !== id)) }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="./"><span className="brand-mark"><Check size={23} strokeWidth={3} /></span>focus<span className="brand-dot">.</span></a>
      <form className="workspace-form" onSubmit={createWorkspace}>
        <label htmlFor="workspace-name">New workspace</label>
        <div>
          <input id="workspace-name" aria-label="Workspace name" placeholder="Workspace name" maxLength={80} value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
          <button aria-label="Create workspace" disabled={!workspaceName.trim() || creatingWorkspace}>{creatingWorkspace ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}</button>
        </div>
      </form>
      <span className="nav-caption">WORKSPACES</span>
      <nav aria-label="Workspaces" className="workspace-list">{workspaces.map(workspace => <div key={workspace.id} className={`workspace-row ${activeWorkspaceId === workspace.id ? 'selected' : ''}`}>
        {editingWorkspace === workspace.id ? <form className="workspace-edit-form" onSubmit={e => void renameWorkspace(e, workspace)}>
          <input autoFocus aria-label="Edit workspace name" value={workspaceDraft} maxLength={80} onChange={e => setWorkspaceDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditingWorkspace(null) }} />
          <button className="save-button" disabled={!workspaceDraft.trim() || workspaceBusy.includes(workspace.id)}>Save</button>
          <button type="button" aria-label="Cancel workspace edit" onClick={() => setEditingWorkspace(null)}><X size={15} /></button>
        </form> : <>
          <button className="workspace-select" onClick={() => void selectWorkspace(workspace.id)} aria-current={activeWorkspaceId === workspace.id ? 'page' : undefined}><Folder size={18} /><span>{workspace.name}</span></button>
          <div className="workspace-actions">
            <button aria-label={`Edit workspace ${workspace.name}`} title="Edit workspace" disabled={workspaceBusy.includes(workspace.id)} onClick={() => { setEditingWorkspace(workspace.id); setWorkspaceDraft(workspace.name) }}><Pencil size={14} /></button>
            <button aria-label={`Delete workspace ${workspace.name}`} title="Delete workspace" disabled={workspaceBusy.includes(workspace.id)} onClick={() => setDeletingWorkspace(workspace)}><Trash2 size={14} /></button>
          </div>
        </>}
      </div>)}</nav>
      <span className="nav-caption">WORKSPACE</span>
      <nav aria-label="Task filters">{filters.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${filter === id ? 'selected' : ''}`} onClick={() => setFilter(id)} aria-current={filter === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span><span className="count">{id === 'all' ? todos.length : id === 'active' ? active : done}</span></button>)}</nav>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div>{activeWorkspace?.name ?? 'Workspace'} <ChevronRight size={14}/><span>{filters.find(f => f.id === filter)?.label}</span></div></header>
      <main>
        <div className="eyebrow"><span/> {activeWorkspace?.name ?? 'Workspace'}</div>
        <div className="page-heading"><div><h1>{filters.find(f => f.id === filter)?.label}<span>.</span></h1><p>{todos.length} tasks in this workspace</p></div><span className="heading-icon"><ClipboardList size={29}/></span></div>
        <section className="overview" aria-label="Task overview"><div><span className="stat-icon purple"><Inbox size={18}/></span><div><strong>{todos.length}</strong><span>Total tasks</span></div></div><div><span className="stat-icon amber"><Circle size={18}/></span><div><strong>{active}</strong><span>In progress</span></div></div><div><span className="stat-icon green"><CheckCheck size={19}/></span><div><strong>{done}</strong><span>Completed</span></div></div></section>
        <section className="task-section" aria-label="Tasks">
          <form className="add-form" onSubmit={add}><Plus size={22}/><input ref={input} aria-label="New task" placeholder="What would you like to get done?" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} disabled={loading || loadFailed || !activeWorkspaceId}/><button className="primary" disabled={!title.trim() || adding || loading || loadFailed || !activeWorkspaceId}>{adding ? <LoaderCircle size={16} className="spin"/> : <Plus size={16}/>}<span>Add task</span></button></form>
          {error && <div className="error" role="alert"><span>{error}</span>{loadFailed && <button onClick={() => void load()}>Try again</button>}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button></div>}
          <div className="list-toolbar"><div className="tabs" aria-label="Filter tasks">{filters.map(f => <button key={f.id} className={filter === f.id ? 'active' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.id === 'all' ? 'All' : f.label}</button>)}</div><label className="search"><Search size={16}/><input aria-label="Search tasks" placeholder="Search tasks" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14}/></button>}</label></div>
          {loading ? <div className="empty" role="status"><LoaderCircle className="spin"/><h2>Loading tasks</h2></div> : loadFailed ? <div className="empty"><Inbox/><h2>Server unavailable</h2><p>Tasks will appear when the API is available.</p><button className="secondary" onClick={() => void load()}>Try again</button></div> : visible.length === 0 ? <div className="empty"><span className="empty-icon">{filter === 'completed' ? <CheckCheck size={29}/> : <Inbox size={29}/>}</span><h2>{query ? 'No matching tasks' : filter === 'completed' ? 'No completed tasks' : filter === 'active' && todos.length ? 'No active tasks' : 'No tasks yet'}</h2><p>{query ? 'Try another search.' : 'Add a task above.'}</p></div> : <ul className="task-list">{visible.map(todo => <li key={todo.id} className={`task-row ${todo.completed ? 'is-done' : ''}`}>
            <button className="check-button" role="checkbox" aria-checked={todo.completed} aria-label={`Mark ${todo.title} as ${todo.completed ? 'active' : 'completed'}`} disabled={busy.includes(todo.id)} onClick={() => void update(todo, { completed: !todo.completed })}>{busy.includes(todo.id) ? <LoaderCircle size={14} className="spin"/> : todo.completed && <Check size={14}/>}</button>
            {editing === todo.id ? <form className="edit-form" onSubmit={e => { e.preventDefault(); if (draft.trim()) void update(todo, { title: draft.trim() }) }}><input autoFocus aria-label="Edit task title" value={draft} maxLength={200} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditing(null) }}/><button className="save-button" disabled={!draft.trim() || busy.includes(todo.id)}>Save</button><button type="button" aria-label="Cancel edit" onClick={() => setEditing(null)}><X size={17}/></button></form> : <><span className="task-title">{todo.title}</span><div className="row-actions"><button aria-label={`Edit ${todo.title}`} title="Edit task" disabled={busy.includes(todo.id)} onClick={() => { setEditing(todo.id); setDraft(todo.title) }}><Pencil size={16}/></button><button aria-label={`Delete ${todo.title}`} title="Delete task" disabled={busy.includes(todo.id)} onClick={() => setDeleting(todo)}><Trash2 size={16}/></button></div></>}
          </li>)}</ul>}
          {!loading && !loadFailed && <div className="list-footer"><span>{active} {active === 1 ? 'task' : 'tasks'} left to do</span><span>{done} completed</span></div>}
        </section>
      </main>
    </div>
    <div className={`toast ${notice ? 'show' : ''}`} role="status">{notice && <><Check size={16}/>{notice}</>}</div>
    <dialog ref={dialog} onCancel={() => setDeleting(null)} onClick={e => { if (e.target === dialog.current && !busy.includes(deleting?.id ?? -1)) setDeleting(null) }}><h2>Delete this task?</h2><p className="delete-title">“{deleting?.title}”</p><p>This task will be permanently removed.</p><div className="dialog-actions"><button className="secondary" disabled={busy.includes(deleting?.id ?? -1)} onClick={() => setDeleting(null)}>Keep task</button><button className="danger" disabled={busy.includes(deleting?.id ?? -1)} onClick={() => void remove()}>{busy.includes(deleting?.id ?? -1) ? 'Deleting…' : 'Delete task'}</button></div></dialog>
    <dialog ref={workspaceDialog} onCancel={() => setDeletingWorkspace(null)} onClick={e => { if (e.target === workspaceDialog.current && !workspaceBusy.includes(deletingWorkspace?.id ?? -1)) setDeletingWorkspace(null) }}><h2>Delete this workspace?</h2><p className="delete-title">“{deletingWorkspace?.name}”</p><p>All tasks in this workspace will be removed.</p><div className="dialog-actions"><button className="secondary" disabled={workspaceBusy.includes(deletingWorkspace?.id ?? -1)} onClick={() => setDeletingWorkspace(null)}>Keep workspace</button><button className="danger" disabled={workspaceBusy.includes(deletingWorkspace?.id ?? -1)} onClick={() => void removeWorkspace()}>{workspaceBusy.includes(deletingWorkspace?.id ?? -1) ? 'Deleting…' : 'Delete workspace'}</button></div></dialog>
  </div>
}
