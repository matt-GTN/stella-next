"use client";

import React, { memo, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Close column menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    }

    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnMenu]);

  const { columns, data, index } = useMemo(() => {
    try {
      const obj = JSON.parse(dfJson);
      return {
        columns: Array.isArray(obj?.columns) ? obj.columns : [],
        data: Array.isArray(obj?.data) ? obj.data : [],
        index: Array.isArray(obj?.index) ? obj.index : [],
      };
    } catch (e) {
      console.error("Failed to parse DataFrame JSON:", e);
      return { columns: [], data: [], index: [] };
    }
  }, [dfJson]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row =>
        row.some(cell =>
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key !== null) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  const handleSort = useCallback((columnIndex) => {
    setSortConfig(prev => ({
      key: columnIndex,
      direction: prev.key === columnIndex && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const toggleColumnVisibility = useCallback((columnIndex) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnIndex)) {
        newSet.delete(columnIndex);
      } else {
        newSet.add(columnIndex);
      }
      return newSet;
    });
  }, []);

  const visibleColumns = columns.filter((_, index) => !hiddenColumns.has(index));

  if (!columns.length || !data.length) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium">Aucune donnée à afficher</p>
          <p className="text-xs text-gray-400 mt-1">Les données apparaîtront ici une fois chargées</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with controls */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-400 to-purple-600 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">
              Données 
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-100">
              {processedData.length} lignes - {columns.length} colonnes
              </span>
              {hiddenColumns.size > 0 && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {hiddenColumns.size} masquées
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Column visibility menu */}
            <div className="relative" ref={columnMenuRef}>
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="p-1.5 text-white hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Gérer les colonnes"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showColumnMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  >
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Colonnes visibles</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {columns.map((col, index) => (
                          <label key={index} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <button
                              onClick={() => toggleColumnVisibility(index)}
                              className="flex items-center gap-2 w-full text-left"
                            >
                              {hiddenColumns.has(index) ? (
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Eye className="w-3 h-3 text-gray-600" />
                              )}
                              <span className={hiddenColumns.has(index) ? "text-gray-400" : "text-gray-700"}>
                                {col}
                              </span>
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Download button */}
            <button
              onClick={() => downloadCsvFromDfJson(dfJson)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-purple-500 border-b border-gray-200">
            <tr>
              {columns.map((col, index) => {
                if (hiddenColumns.has(index)) return null;

                return (
                  <th
                    key={index}
                    className="px-4 py-3 text-left cursor-pointer hover:bg-purple-500 text-purple-500 hover:text-white transition-colors group"
                    onClick={() => handleSort(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate">
                        {col}
                      </span>
                      <div className="flex flex-col">
                        {sortConfig.key === index ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-purple-600" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-purple-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={`${currentPage}-${rowIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.map((cell, cellIndex) => {
                    if (hiddenColumns.has(cellIndex)) return null;

                    return (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="text-xs text-purple-800 truncate max-w-xs" title={String(cell)}>
                          {cell === null || cell === undefined ? (
                            <span className="text-gray-400 italic">—</span>
                          ) : typeof cell === "number" ? (
                            <span className="font-mono">
                              {Number(cell).toLocaleString("fr-FR")}
                            </span>
                          ) : (
                            String(cell)
                          )}
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Lignes par page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, processedData.length)} sur {processedData.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-medium text-gray-700 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default memo(DataFrameTable);

