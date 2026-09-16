import test from 'node:test'
import assert from 'node:assert/strict'
const base = process.env.API_URL || 'http://127.0.0.1:3333/api'
const call = (path, method = 'GET', body) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
test('CRUD, persistence through fresh reads, and input validation', async () => {
  let id
  try {
    const workspaces = await call('/workspaces')
    assert.equal(workspaces.status, 200)
    const workspace = (await workspaces.json()).data[0]
    assert.ok(workspace.id)
    const created = await call('/todos', 'POST', { title: '  ทดสอบงาน 📝  ', workspaceId: workspace.id })
    assert.equal(created.status, 201)
    const { data } = await created.json(); id = data.id
    assert.equal(data.title, 'ทดสอบงาน 📝'); assert.equal(data.completed, false)
    assert.equal(data.workspaceId, workspace.id)
    assert.ok(data.createdAt)
    assert.ok((await (await call(`/todos?workspaceId=${workspace.id}`)).json()).data.some(t => t.id === id))
    const changed = await call(`/todos/${id}`, 'PATCH', { title: 'Edited task', completed: true })
    assert.equal(changed.status, 200)
    const fetched = (await (await call(`/todos/${id}`)).json()).data
    assert.equal(fetched.title, 'Edited task'); assert.equal(fetched.completed, true)
    assert.equal((await call(`/todos/${id}`, 'PATCH', { completed: false })).status, 200)
    for (const body of [{ title: '' }, { title: '   ' }, { title: 'x'.repeat(201) }, { title: 123 }, { title: 'Valid', completed: 'true' }, { title: 'Valid', $attributes: {} }]) {
      assert.equal((await call('/todos', 'POST', body)).status, 422)
    }
    for (const body of [{}, { title: '' }, { completed: null }, { id: 2 }]) assert.equal((await call(`/todos/${id}`, 'PATCH', body)).status, 422)
    for (const badId of ['abc', '0', '-1', '99999999999999999']) assert.equal((await call(`/todos/${badId}`)).status, 404)
    const cors = await fetch(base + '/todos', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'content-type' } })
    assert.equal(cors.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal((await call(`/todos/${id}`, 'DELETE')).status, 204)
    assert.equal((await call(`/todos/${id}`)).status, 404)
    assert.equal((await call(`/todos/${id}`, 'PATCH', { completed: true })).status, 404)
    assert.equal((await call(`/todos/${id}`, 'DELETE')).status, 404)
    id = undefined
  } finally { if (id) await call(`/todos/${id}`, 'DELETE') }
})

test('workspace CRUD and scoped task lists', async () => {
  const name = `API workspace ${Date.now()}`
  const createdWorkspace = await call('/workspaces', 'POST', { name })
  assert.equal(createdWorkspace.status, 201)
  const workspace = (await createdWorkspace.json()).data
  assert.equal(workspace.name, name)
  let workspaceId = workspace.id
  let id
  try {
    const renamed = await call(`/workspaces/${workspaceId}`, 'PATCH', { name: `${name} renamed` })
    assert.equal(renamed.status, 200)
    assert.equal((await renamed.json()).data.name, `${name} renamed`)
    assert.equal((await call(`/workspaces/${workspaceId}`)).status, 200)
    const createdTask = await call('/todos', 'POST', { title: 'Workspace task', workspaceId })
    assert.equal(createdTask.status, 201)
    id = (await createdTask.json()).data.id
    const scoped = (await (await call(`/todos?workspaceId=${workspaceId}`)).json()).data
    assert.ok(scoped.some(t => t.id === id))
    assert.equal((await call('/workspaces', 'POST', { name: '' })).status, 422)
    assert.equal((await call(`/workspaces/${workspaceId}`, 'PATCH', { name: '' })).status, 422)
    assert.equal((await call('/workspaces/abc')).status, 404)
    assert.equal((await call('/todos', 'POST', { title: 'Bad workspace', workspaceId: 2147483647 })).status, 404)
    assert.equal((await call(`/workspaces/${workspaceId}`, 'DELETE')).status, 204)
    workspaceId = undefined
    assert.equal((await call(`/todos/${id}`)).status, 404)
    id = undefined
  } finally {
    if (id) await call(`/todos/${id}`, 'DELETE')
    if (workspaceId) await call(`/workspaces/${workspaceId}`, 'DELETE')
  }
})

test('reject unsafe payloads and unsupported body formats', async () => {
  for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=test']) {
    const result = await fetch(base + '/todos', { method: 'POST', headers: { 'Content-Type': type }, body: 'title=unsafe' })
    assert.equal(result.status, 415)
  }
  const large = await call('/todos', 'POST', { title: 'x'.repeat(20000) })
  assert.equal(large.status, 413)
  const malformed = await fetch(base + '/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"title":' })
  assert.equal(malformed.status, 400)
  let id
  try {
    const created = await call('/todos', 'POST', { title: 'Protected task' })
    assert.equal(created.status, 201); id = (await created.json()).data.id
    for (const field of ['$attributes', '$extras', '$isPersisted', '__proto__', 'constructor', 'createdAt']) {
      const body = JSON.parse(`{"${field}":{}}`)
      assert.equal((await call(`/todos/${id}`, 'PATCH', body)).status, 422)
      assert.equal((await (await call(`/todos/${id}`)).json()).data.title, 'Protected task')
    }
  } finally { if (id) await call(`/todos/${id}`, 'DELETE') }
})
