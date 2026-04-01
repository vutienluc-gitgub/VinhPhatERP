import type { TableRow, TableInsert, TableUpdate } from './common'

export type Profile = TableRow<'profiles'>
export type ProfileInsert = TableInsert<'profiles'>
export type ProfileUpdate = TableUpdate<'profiles'>
