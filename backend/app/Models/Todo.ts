import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
export default class Todo extends BaseModel {
  @column({ isPrimary: true }) public id: number
  @column({ serializeAs: 'workspaceId' }) public workspaceId: number
  @column() public title: string
  @column() public completed: boolean
  @column.dateTime({ autoCreate: true, serializeAs: 'createdAt' }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: 'updatedAt' }) public updatedAt: DateTime
}
