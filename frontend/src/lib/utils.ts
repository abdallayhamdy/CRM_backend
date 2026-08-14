import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency (USD by default).
 */
export function formatCurrency(amount: number | string, currency = "USD") {
  const value = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value)
}

/**
 * Standardized date formatting for the CRM.
 * Example: "Oct 24, 2023"
 */
export function formatDate(date: Date | string | number, formatStr = "MMM d, yyyy") {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return "Invalid Date"
  return format(dateObj, formatStr)
}

/**
 * Exports a set of data to a CSV file.
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || !data.length) return

  const headers = Object.keys(data[0]).map(h => `"${h.replace(/"/g, '""')}"`).join(",")
  const rows = data.map(obj => 
    Object.values(obj)
      .map(val => {
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(",")
  )
  
  const csvContent = [headers, ...rows].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
