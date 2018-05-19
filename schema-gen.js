const _ = require('lodash')
const pgStructure = require('pg-structure')
const typesMap = {
  bigint: 'bigInteger',
  'timestamp with time zone': 'timestamp',
  'character varying': 'string',
  text: 'text',
  'double precision': 'float',
  boolean: 'boolean',
  tsvector: 'specificType',
  character: 'string'
}

async function getTableNames(db, schema = 'public') {
  const structure = await pgStructure(db.client.connectionSettings)
  return structure.schemas.get(schema).tables.array.map(({ name }) => name)
}

module.exports = async (db, onlyTable) => {
  const tables = await getTableNames(db)
  let allTables = ''

  for (let tablename of tables) {
    if (onlyTable && tablename !== onlyTable) {
      continue
    }
    // console.log('tablename', tablename)
    const info = await db(tablename).columnInfo()
    const refsQueryResult = await db.raw(`SELECT
    tc.constraint_name, tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${tablename}';`)
    const primaryQueryResult = await db.raw(`SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                         AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = '${tablename}'::regclass
    AND    i.indisprimary;`)
    const primaryKeys = primaryQueryResult.rows.map(({ attname }) => attname)
    const refs = refsQueryResult.rows
    const columns = Object.keys(info).map(columnName => {
      const columnInfo = info[columnName]
      if (columnName === 'id' && columnInfo.defaultValue.match(/^nextval\(/)) {
        return 'table.increments()'
      }
      let typeCall = `('${columnName}')`
      // console.log(columnName, columnInfo)
      if (columnInfo.maxLength) {
        typeCall = `('${columnName}', ${columnInfo.maxLength})`
      }
      let refCall = ''
      const ref = _.find(refs, { column_name: columnName })
      if (ref) {
        refCall = `.references('${ref.foreign_table_name}.${
          ref.foreign_column_name
        }')`
      }
      let nullableCall = ''
      if (columnInfo.nullable === false) {
        nullableCall = '.notNullable()'
      }
      let primaryCall = ''
      if (primaryKeys.length === 1 && primaryKeys[0] === columnName) {
        primaryCall = '.primary()'
      }
      let defaultCall = ''
      if (columnInfo.defaultValue !== null) {
        let defaultValue = columnInfo.defaultValue.split('::')[0]
        const hasQuotes = defaultValue.includes("'")
        if (hasQuotes) {
          const inQuotes = defaultValue.split("'")[1]
          if (!isNaN(Number(inQuotes))) {
            defaultValue = Number(inQuotes)
          }
        } else if (defaultValue === 'now()') {
          defaultValue = `db.raw('CURRENT_TIMESTAMP')`
        }

        nullableCall = `.defaultTo(${defaultValue})`
      }
      return `table.${
        typesMap[columnInfo.type]
      }${typeCall}${refCall}${defaultCall}${primaryCall}${nullableCall}`
    })
    if (primaryKeys.length > 1) {
      columns.push(`table.primary(${JSON.stringify(primaryKeys)})`)
    }
    const tableCreate = `await db.schema.createTable('${tablename}', function (table){
      ${columns.join('\n')}
    })`

    allTables += tableCreate
  }
  return allTables
}
