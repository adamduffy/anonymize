# anonymize

Anonymize a SQL database (currently only postgresql)

# simple usage

`./anonymize.sh [databasename] [config_filename]`

see anonymize.sh for implementation details.

# how it works

anonymize will analyze your sql schema to generate a set of update statements and apply to the given database. All nullable fields become `null`, all character based fields become `CONCAT(table_name, column_name, id)`, all numerics become `1`, etc. primary key fields and relationships will remain intact. there is only one update statement per table (i.e. bulk update). defaults and specific table/column values can be customized.

# configuration

anonymize requires a config file to run (example provided).
the config is a javascript object that consists of 3 parts:

1.  `_default_type_values`
    format: `[ {types: [string], value: string}, ... ]`.
    types is a list of sql data types, value is a sql expression.
2.  `_skip_all`
    format: `{tables: [string], types: [string], columns: [string]}`.
    skips anonymizing specified tables, types, or columns.
3.  custom table and column values:
    format: `table_name: {column_name: value, ...}`.
    `value` must be a sql expression that will apply to all rows in the column.
    optional: `table_name: {_skip: [string]}` to skip specified columns.

when working with the config file, keep in mind you can and should use raw sql statements on the `value` properties. for example:
`{email: "CONCAT('user', id, '@domain.com')"}` will be per row, whereas `{email: 'user${id}@domain.com'}` will be per table (and id is undefined).

# debugging

`anonymize.sh` is a three step process:

1.  generate the schema template json.
2.  generate the update statements.
3.  apply the update statements.

these can be broken down during initial setup and debugging:

1.  `psql -d my_database -t -c "$(node anonymize.js -gen postgres)" > _schema.json` should create a recognizable json file of your schema
2.  `node anonymize.js _schema.json ./config.js > _updates.sql` should generate a list of update statements.
3.  `psql -d my_database -c "$(cat _updates.sql)"` should run the updates.
