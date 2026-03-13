import React from "react";
import { formatChartValue } from "lib/utils";

/**
 * NumberChart (Statistic/Scalar Chart)
 * Menampilkan satu angka besar tunggal untuk sebuah metrik
 *
 * @param {string} title - Judul metrik (mis. "Total Users")
 * @param {number|string} value - Nilai angka yang akan ditampilkan
 * @param {string|number} width - Lebar komponen
 * @param {string|number} height - Tinggi komponen
 */
export default function NumberChart({
  title,
  value,
  width = "100%",
  height = "100%",
}) {
  // Parsing value to float if possible for formatting
  const numericValue = parseFloat(value);
  const displayValue = !isNaN(numericValue)
    ? formatChartValue(numericValue)
    : value;

  return (
    <div
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg"
      style={{ width, height }}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        {title && (
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </span>
        )}
        <span className="text-5xl font-bold text-gray-800 tracking-tight">
          {displayValue !== undefined && displayValue !== null
            ? displayValue
            : "-"}
        </span>
      </div>
    </div>
  );
}
