import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Workspace extends BaseModel {
  @column({ isPrimary: true }) public id: number
  @column() public name: string
  @column.dateTime({ autoCreate: true, serializeAs: 'createdAt' }) public createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: 'updatedAt' }) public updatedAt: DateTime
}
