# Snapshot report for `schema-gen.spec.js`

The actual snapshot is saved in `schema-gen.spec.js.snap`.

Generated by [AVA](https://ava.li).

## schemaGenerator

> Snapshot 1

    `await db.schema.createTable('users', function (table){␊
          table.string('username', 100)␊
    table.string('email', 100)␊
    table.string('first_name', 100)␊
    table.string('last_name', 100)␊
    table.string('verified', 100)␊
    table.string('password', 200)␊
        })`