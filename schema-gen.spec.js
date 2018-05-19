import schemaGenerator from './schema-gen'
import knex from 'knex'
import test from 'ava'

const db = knex({
  client: 'pg',
  connection: {
    port: 35432,
    user: 'postgres',
    password: 'postgresrootpassword',
    database: 'schemaGenTest'
  }
})

const setup = async () => {
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', function(table) {
      table.string('username', 100)
      table.string('email', 100)
      table.string('first_name', 100)
      table.string('last_name', 100)
      table.string('verified', 100)
      table.string('password', 200)
    })
  }
}

test('schemaGenerator', async t => {
  await setup()
  const schema = await schemaGenerator(db)

  t.is(
    schema,
    `await db.schema.createTable('users', function (table){
      table.string('username', 100)
table.string('email', 100)
table.string('first_name', 100)
table.string('last_name', 100)
table.string('verified', 100)
table.string('password', 200)
    })`
  )
})
