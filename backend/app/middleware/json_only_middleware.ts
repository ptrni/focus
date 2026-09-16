import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
export default class JsonOnlyMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    if (['POST', 'PATCH', 'PUT'].includes(request.method()) && request.header('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return response.unsupportedMediaType({ message: 'Use application/json.' })
    }
    return next()
  }
}
