# knex-pg-schema-code-gen

generates a knex schema createTable calls from your exisitng Postgre database. Useful when you want to start using knex for instrumenting your DB in tests for example.
Sure you could just make a dump of your schema, but if you want to keep changing the DB schema you'd have to either manually change the SQL dump or you'd have to make a new dump every time.
Having the DB instrumentation in JS makes it much more maintainable in the long run.

## Usage

```javascript
import schemaGenerator from './schema-gen'
const schemaCode = await schemaGenerator(db)  // schema is a string with calls for all tables
const schemaCode = await schemaGenerator(db, 'my_uber_table')  // optionally you can call with second argument to limit for just one table
```
