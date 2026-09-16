import type { HttpContext } from '@adonisjs/core/http'
import Workspace from '#models/Workspace'

export default class WorkspacesController {
  private validId(id: string) { return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647 }
  private payload(body: Record<string, unknown>) {
    const errors: string[] = []
    const data: { name?: string } = {}
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) errors.push('Workspace name must contain 1-80 characters.')
    else data.name = body.name.trim()
    if (Object.keys(body).some(key => key !== 'name')) errors.push('Unknown field in request.')
    return { errors, data }
  }

  public async index() {
    return { data: await Workspace.query().orderBy('created_at', 'asc').orderBy('id', 'asc') }
  }

  public async store({ request, response }: HttpContext) {
    const { errors, data } = this.payload(request.body())
    if (errors.length) return response.unprocessableEntity({ message: errors.join(' ') })
    const workspace = await Workspace.create(data)
    return response.created({ data: workspace })
  }

  public async show({ params, response }: HttpContext) {
    const workspace = this.validId(params.id) ? await Workspace.find(params.id) : null
    if (!workspace) return response.notFound({ message: 'Workspace not found.' })
    return { data: workspace }
  }

  public async update({ params, request, response }: HttpContext) {
    const workspace = this.validId(params.id) ? await Workspace.find(params.id) : null
    if (!workspace) return response.notFound({ message: 'Workspace not found.' })
    const { errors, data } = this.payload(request.body())
    if (errors.length) return response.unprocessableEntity({ message: errors.join(' ') })
    await workspace.merge(data).save()
    return { data: workspace }
  }

  public async destroy({ params, response }: HttpContext) {
    const workspace = this.validId(params.id) ? await Workspace.find(params.id) : null
    if (!workspace) return response.notFound({ message: 'Workspace not found.' })
    await workspace.delete()
    return response.noContent()
  }
}
