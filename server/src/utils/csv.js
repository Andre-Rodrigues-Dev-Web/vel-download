function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `\"${text.replace(/\"/g, "\"\"")}\"`;
  }

  return text;
}

function toCsv(rows, columns) {
  const header = columns.map((column) => escapeCsv(column.label)).join(",");

  const lines = rows.map((row) =>
    columns.map((column) => escapeCsv(row[column.key])).join(",")
  );

  return [header, ...lines].join("\n");
}

module.exports = {
  toCsv
};
