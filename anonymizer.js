function updateToSql(update) {
  return Object.keys(update)
    .map(k => `${k}=${update[k]}`)
    .join(", ");
}

function updatesToSql(updates) {
  return Object.keys(updates)
    .map(
      k =>
        Object.keys(updates[k]).length > 0
          ? `UPDATE ${k} SET ${updateToSql(updates[k])};`
          : `-- no updates for ${k};`
    )
    .join("\n");
}

function defaultValueFor(c, defaults) {
  if (c.is_nullable) return "NULL";
  d = defaults.find(d => d.types.includes(c.data_type));
  if (d) return d.value;
  throw new Error(
    `Unknown data type '${c.data_type}' on '${c.table_name}.${
      c.column_name
    }'.  Add default or custom value in config.js`
  );
}

function configValueFor(c, config) {
  return config[c.table_name] && config[c.table_name][c.column_name];
}

function valueFor(c, config) {
  return (
    configValueFor(c, config) || defaultValueFor(c, config._default_type_values)
  );
}

function skippable(c, config) {
  var skip = config._skip_all;
  if (skip.tables.includes(c.table_name)) return true;
  if (skip.types.includes(c.data_type)) return true;
  if (skip.columns.includes(c.column_name)) return true;
  cfg = config[c.table_name] || {};
  if (cfg._skip && cfg._skip.includes(c.column_name)) return true;
}

function anonymize(schema, config) {
  var updates = {};
  schema.forEach(c => {
    if (skippable(c, config)) return;
    if (!updates[c.table_name]) updates[c.table_name] = {};
    var val = valueFor(c, config);
    if (typeof val == "function") {
      val = val(c);
    }
    updates[c.table_name][c.column_name] = val;
  });
  return updates;
}

module.exports = {
  anonymize,
  updatesToSql
};
