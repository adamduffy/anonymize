set -euo pipefail
SCHEMA_QUERY="$(node anonymize.js -gen postgres)"
psql -d $1 -t -c "${SCHEMA_QUERY}" > _schema.json
node anonymize.js _schema.json $2 > _updates.sql
psql -d $1 -c "$(cat _updates.sql)"
rm _schema.json
rm _updates.sql
