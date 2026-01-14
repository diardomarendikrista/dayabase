import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes) {
  return twMerge(clsx(classes));
}

// format value untuk chart (number, currency, percent)
export const formatChartValue = (value, type = "number") => {
  if (value === null || value === undefined) return "-";

  const num = Number(value);
  if (isNaN(num)) return value; // Kalau bukan angka, kembalikan teks aslinya

  if (type === "currency") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  if (type === "percent") {
    return num + "%";
  }

  // Default: Number (separator ribuan)
  return num.toLocaleString("id-ID");
};

// Format Tanggal (Native JS)
export const formatDateCell = (value) => {
  // Regex untuk mendeteksi format ISO String (YYYY-MM-DDTHH:mm:ss.sssZ)
  // Contoh: 2025-07-09T17:00:00.000Z
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T/;

  // Cek apakah value adalah string dan sesuai pola tanggal ISO
  if (typeof value === "string" && isoDateRegex.test(value)) {
    try {
      const date = new Date(value);

      // Cek validitas date object (jaga-jaga jika invalid date)
      if (isNaN(date.getTime())) return value;

      // Format menggunakan Intl.DateTimeFormat (Bawaan Browser)
      // Hasil: "09 Jul 2025" (sesuai locale id-ID)
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        // hour: "2-digit",
        // minute: "2-digit",
      }).format(date);
    } catch (e) {
      // Jika error parsing, kembalikan value asli
      return value;
    }
  }

  // Jika bukan tanggal, kembalikan apa adanya
  return value;
};
