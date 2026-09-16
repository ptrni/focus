import { test, expect } from '@playwright/test'
test('add, edit, complete, filter, reload and delete a task', async ({ page, request }, testInfo) => {
  const workspaceName = `Browser workspace ${testInfo.project.name} ${Date.now()}`
  const renamedWorkspace = `${workspaceName} renamed`
  const title = `Browser task ${testInfo.project.name} ${Date.now()}`
  const edited = `${title} edited`
  let workspaceId: number | undefined
  let id: number | undefined
  try {
    await page.goto('/')
    await page.getByRole('textbox', { name: 'Workspace name' }).fill(workspaceName)
    await page.getByRole('button', { name: 'Create workspace' }).click()
    await expect(page.getByRole('button', { name: workspaceName, exact: true })).toBeVisible()
    await page.getByRole('button', { name: `Edit workspace ${workspaceName}`, exact: true }).click()
    await page.getByRole('textbox', { name: 'Edit workspace name' }).fill(renamedWorkspace)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: renamedWorkspace, exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'New task' })).toBeEnabled()
    await page.getByRole('textbox', { name: 'New task' }).fill(title)
    await page.getByRole('button', { name: 'Add task', exact: true }).click()
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    const workspaces = await (await request.get('http://127.0.0.1:3333/api/workspaces')).json()
    workspaceId = workspaces.data.find((workspace: { name: string }) => workspace.name === renamedWorkspace)?.id
    const tasks = await (await request.get(`http://127.0.0.1:3333/api/todos?workspaceId=${workspaceId}`)).json()
    id = tasks.data.find((t: { title: string }) => t.title === title)?.id
    await page.getByRole('button', { name: `Edit ${title}`, exact: true }).click()
    await page.getByRole('textbox', { name: 'Edit task title' }).fill(edited)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(edited, { exact: true })).toBeVisible()
    await page.getByRole('checkbox', { name: `Mark ${edited} as completed`, exact: true }).click()
    await expect(page.getByRole('checkbox', { name: `Mark ${edited} as active` })).toHaveAttribute('aria-checked', 'true')
    await page.reload()
    await expect(page.getByRole('checkbox', { name: `Mark ${edited} as active` })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: 'Active', exact: true }).click()
    await expect(page.getByText(edited, { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Completed', exact: true }).click()
    await page.getByRole('textbox', { name: 'Search tasks' }).fill(edited)
    await expect(page.getByText(edited, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `test-results/${testInfo.project.name}.png`, fullPage: true })
    await page.getByRole('button', { name: `Delete ${edited}`, exact: true }).click()
    await page.getByRole('button', { name: 'Keep task' }).click()
    await expect(page.getByText(edited, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: `Delete ${edited}`, exact: true }).click()
    await page.getByRole('button', { name: 'Delete task', exact: true }).click()
    await expect(page.getByText(edited, { exact: true })).toHaveCount(0)
    id = undefined
    await page.getByRole('button', { name: `Delete workspace ${renamedWorkspace}`, exact: true }).click()
    await page.getByRole('button', { name: 'Keep workspace', exact: true }).click()
    await expect(page.getByRole('button', { name: renamedWorkspace, exact: true })).toBeVisible()
    await page.getByRole('button', { name: `Delete workspace ${renamedWorkspace}`, exact: true }).click()
    await page.getByRole('button', { name: 'Delete workspace', exact: true }).click()
    await expect(page.getByRole('button', { name: renamedWorkspace, exact: true })).toHaveCount(0)
    workspaceId = undefined
  } finally {
    if (id) await request.delete(`http://127.0.0.1:3333/api/todos/${id}`)
    if (workspaceId) await request.delete(`http://127.0.0.1:3333/api/workspaces/${workspaceId}`)
  }
})
test('connection errors offer a retry', async ({ page }) => {
  await page.route('**/api/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Cannot reach the server')
  await page.unroute('**/api/**')
  await page.getByRole('button', { name: 'Try again' }).first().click()
  await expect(page.getByRole('textbox', { name: 'New task' })).toBeEnabled()
})
