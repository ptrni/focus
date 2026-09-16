import type { HttpContext } from '@adonisjs/core/http'
import Todo from '#models/Todo'
import Workspace from '#models/Workspace'

export default class TodosController {
  private validId(id: string) { return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647 }
  private async defaultWorkspace() {
    const workspace = await Workspace.query().orderBy('id', 'asc').first()
    return workspace ?? await Workspace.create({ name: 'My workspace' })
  }
  private async workspace(id: unknown) {
    if (id === undefined || id === null || id === '') return this.defaultWorkspace()
    const value = String(id)
    if (!this.validId(value)) return null
    return Workspace.find(Number(value))
  }
  private payload(body: Record<string, unknown>, partial: boolean) {
    const errors: string[] = []
    const data: { title?: string; completed?: boolean; workspaceId?: number } = {}
    if (!partial || 'title' in body) {
      if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) errors.push('Title must contain 1–200 characters.')
      else data.title = body.title.trim()
    }
    if ('completed' in body) {
      if (typeof body.completed !== 'boolean') errors.push('Completed must be a boolean.')
      else data.completed = body.completed
    }
    if (!partial && 'workspaceId' in body) {
      if (!this.validId(String(body.workspaceId))) errors.push('Workspace not found.')
      else data.workspaceId = Number(body.workspaceId)
    }
    if (Object.keys(body).some(key => !(partial ? ['title', 'completed'] : ['title', 'completed', 'workspaceId']).includes(key))) errors.push('Unknown field in request.')
    if (partial && !Object.keys(data).length && !errors.length) errors.push('Provide title or completed.')
    return { errors, data }
  }
  public async index({ request, response }: HttpContext) {
    const workspaceId = request.qs().workspaceId
    if (workspaceId !== undefined && !await this.workspace(workspaceId)) return response.notFound({ message: 'Workspace not found.' })
    const query = Todo.query().orderBy('created_at', 'desc').orderBy('id', 'desc')
    if (workspaceId !== undefined) query.where('workspace_id', Number(workspaceId))
    return { data: await query }
  }
  public async store({ request, response }: HttpContext) {
    const { errors, data } = this.payload(request.body(), false)
    if (errors.length) return response.unprocessableEntity({ message: errors.join(' ') })
    const workspace = await this.workspace(data.workspaceId)
    if (!workspace) return response.notFound({ message: 'Workspace not found.' })
    data.workspaceId = workspace.id
    const todo = await Todo.create({ ...data, completed: data.completed ?? false })
    return response.created({ data: todo })
  }
  public async show({ params, response }: HttpContext) {
    const todo = this.validId(params.id) ? await Todo.find(params.id) : null
    if (!todo) return response.notFound({ message: 'Task not found.' })
    return { data: todo }
  }
  public async update({ params, request, response }: HttpContext) {
    const todo = this.validId(params.id) ? await Todo.find(params.id) : null
    if (!todo) return response.notFound({ message: 'Task not found.' })
    const { errors, data } = this.payload(request.body(), true)
    if (errors.length) return response.unprocessableEntity({ message: errors.join(' ') })
    await todo.merge(data).save()
    return { data: todo }
  }
  public async destroy({ params, response }: HttpContext) {
    const todo = this.validId(params.id) ? await Todo.find(params.id) : null
    if (!todo) return response.notFound({ message: 'Task not found.' })
    await todo.delete()
    return response.noContent()
  }
}
