function sqlRandomFromList(csv) {
  return `('{${csv}}'::text[])[ceil(random()*${csv.split(",").length - 1})]`;
}

// default_type_values = [{ types: array<string>, value: f(c) | string }, ...]
const default_type_values = [
  {
    types: ["character varying", "character", "text"],
    value: c => `concat('${c.column_name}', id)`
  },
  {
    types: ["timestamp", "timestamp without time zone"],
    value: "current_timestamp"
  },
  { types: ["integer", "bigint", "numeric", "double precision"], value: 1 },
  { types: ["date"], value: "current_date" },
  { types: ["boolean"], value: "false" },
  { types: ["jsonb"], value: "'{}'" },
  { types: ["ARRAY"], value: "'[]'" }, //i think this should be "ARRAY['']" ? not sure
  { types: ["uuid"], value: "uuid_generate_v4()" }
];

module.exports = {
  _default_type_values: default_type_values,
  // _truncate_tables: [], //maybe todo?
  _skip_all: {
    tables: [],
    types: ["timestamp", "timestamp without time zone", "date", "boolean"],
    columns: ["created_at", "updated_at", "deleted_at"]
  },
  users: {
    _skip: ["encrypted_password"],
    email: "CONCAT('user', id, '@domain.com')"
  }
};
