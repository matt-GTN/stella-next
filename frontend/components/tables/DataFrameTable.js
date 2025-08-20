"use client";

import React, { memo, useMemo } from "react";

function downloadCsvFromDfJson(dfJson) {
  try {
    const obj = JSON.parse(dfJson);
    const cols = Array.isArray(obj?.columns) ? obj.columns : [];
    const rows = Array.isArray(obj?.data) ? obj.data : [];
    const csv = [cols.join(",")]
      .concat(
        rows.map((r) =>
          r
            .map((v) => {
              if (v === null || v === undefined) return "";
              const s = String(v).replace(/"/g, '""');
              return /[",\n]/.test(s) ? `"${s}"` : s;
            })
            .join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stella_dataframe.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to export CSV:", e);
  }
}

function DataFrameTable({ dfJson }) {
  const { columns, data } = useMemo(() => {
    try {
      // dfJson uses pandas orient='split'
      const obj = JSON.parse(dfJson);
      return {
        columns: Array.isArray(obj?.columns) ? obj.columns : [],
        data: Array.isArray(obj?.data) ? obj.data : [],
        index: Array.isArray(obj?.index) ? obj.index : [],
      };
    } catch (e) {
      console.error("Failed to parse DataFrame JSON:", e);
      return { columns: [], data: [] };
    }
  }, [dfJson]);

  if (!columns.length || !data.length) {
    return <div className="text-xs text-gray-600">Aucune donnée à afficher.</div>;
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-xl bg-white">
      <div className="flex justify-end">
        <button
          onClick={() => downloadCsvFromDfJson(dfJson)}
          className="m-2 px-2 py-1 text-[11px] border rounded-md text-gray-700 hover:bg-gray-50"
        >
          Télécharger CSV
        </button>
      </div>
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-800 border-b whitespace-nowrap">
                  {typeof cell === "number"
                    ? Number(cell).toLocaleString("fr-FR")
                    : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(DataFrameTable);

