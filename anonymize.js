"use strict";

const usage_info = `# create config.js per documentation
# generate schema.json file:
# psql -d my_database -t -c "$(node anonymize.js -gen postgres)" > schema.json
# preview update statements using:
# node anonymize.js schema.json
# execute update statements:
# psql -d my_database -c "$(node anonymize.js schema.json)"`;

const schema_query_postgres = `SELECT to_json(array_agg(t)) FROM (
  SELECT isc.table_name, isc.column_name, isc.data_type, isc.character_maximum_length as char_max, CASE WHEN(isc.is_nullable='YES') THEN true ELSE false END as is_nullable
  FROM INFORMATION_SCHEMA.COLUMNS isc
  INNER JOIN INFORMATION_SCHEMA.TABLES ist ON isc.table_name=ist.table_name
  FULL OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu ON kcu.table_catalog=isc.table_catalog AND kcu.table_name=isc.table_name AND kcu.column_name=isc.column_name
  WHERE ist.table_schema='public' AND isc.table_schema='public' AND kcu.column_name IS NULL AND ist.table_schema='public' AND ist.table_type='BASE TABLE'
  ORDER BY isc.table_name
  ) AS t;`;

//untested but might work:
const schema_query_mysql = `SELECT CONCAT('[', GROUP_CONCAT(json_object('table_name', t.table_name, 'column_name', t.column_name, 'data_type', t.data_type, 'char_max', t.char_max, 'is_nullable', t.is_nullable)), ']') FROM (
  SELECT isc.table_name, isc.column_name, isc.data_type, isc.character_maximum_length as char_max, CASE WHEN(isc.is_nullable='YES') THEN true ELSE false END as is_nullable
  FROM INFORMATION_SCHEMA.COLUMNS isc
  INNER JOIN INFORMATION_SCHEMA.TABLES ist ON isc.table_name=ist.table_name
  LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu ON kcu.table_catalog=isc.table_catalog AND kcu.table_name=isc.table_name AND kcu.column_name=isc.column_name
  WHERE ist.table_schema=DATABASE() AND isc.table_schema=DATABASE() AND kcu.column_name IS NULL AND ist.table_type='BASE TABLE'
  ORDER BY isc.table_name
) AS t;`;

if (process.argv[2] == "-gen") {
  const query =
    process.argv[3] == "mysql" ? schema_query_mysql : schema_query_postgres;
  console.log(query.replace(/(\r\n\t|\n|\r\t)/gm, ""));
  return;
}

var schema, config;
try {
  const schemaFilename = process.argv[2];
  const configFilename = process.argv[3];
  if (!schemaFilename || !configFilename) {
    throw new Error("Missing schema filename");
  }
  const fs = require("fs");
  config = require(configFilename);
  schema = JSON.parse(fs.readFileSync(schemaFilename));
} catch (e) {
  console.error();
  console.error(usage_info);
  console.error();
  throw e;
}
const anonymizer = require("./anonymizer");
var updates = anonymizer.anonymize(schema, config);
console.log(anonymizer.updatesToSql(updates));
