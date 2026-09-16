import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    let workspaceId = 1
    this.schema.createTable('workspaces', (table) => {
      table.increments('id')
      table.string('name', 80).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.defer(async (db) => {
      const now = new Date()
      const [workspace] = await db.table('workspaces').insert({
        name: 'My workspace',
        created_at: now,
        updated_at: now,
      }).returning('id')
      workspaceId = typeof workspace === 'object' ? workspace.id : workspace
    })

    this.schema.alterTable('todos', (table) => {
      table.integer('workspace_id').unsigned().references('id').inTable('workspaces').onDelete('CASCADE')
      table.index(['workspace_id', 'created_at'])
    })

    this.defer(async (db) => {
      await db.from('todos').update({ workspace_id: workspaceId })
    })

    this.schema.alterTable('todos', (table) => {
      table.integer('workspace_id').unsigned().notNullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable('todos', (table) => {
      table.dropIndex(['workspace_id', 'created_at'])
      table.dropColumn('workspace_id')
    })
    this.schema.dropTable('workspaces')
  }
}
