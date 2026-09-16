import { BaseSchema } from '@adonisjs/lucid/schema'
export default class Todos extends BaseSchema {
  protected tableName = 'todos'
  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title', 200).notNullable()
      table.boolean('completed').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }
  public async down() { this.schema.dropTable(this.tableName) }
}
