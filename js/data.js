// js/data.js
export const TOROB_BRANDS = [ /* لیست برندها */ ];

export function extractBrand(title) { /* همون تابع قبلی */ }

export function extractSize(title) {
  if (!title) return 'نامشخص';
  const normalized = title.replace(/[\u200C\u200D]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const regexes = [
    /(\d{2,3})\s*اینچ/i,
    /سایز\s*(\d{2,3})/i,
    /اندازه\s*(\d{2,3})/i,
    /[\d۰-۹]{2,3}\s*اینچ/i
  ];

  for (let regex of regexes) {
    const match = normalized.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10);
      if (num >= 32 && num <= 100) return num.toString();
    }
  }
  return 'نامشخص';
}

export function extractTech(title) { /* ... */ }
