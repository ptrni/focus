import { defineConfig } from '@adonisjs/core/bodyparser'
export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: { encoding: 'utf-8', limit: '16kb', strict: true, types: ['application/json'] },
  form: { types: [] },
  multipart: { autoProcess: false, types: [] },
})
