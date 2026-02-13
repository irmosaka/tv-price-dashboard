// js/data.js
import { toPersianDigits } from './utils.js';

export const TOROB_BRANDS = [
  "سامسونگ", "سام الکترونیک", "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سونی", "لیماک جنرال اینترنشنال", "نکسار", "هایسنس",
  "ورلد استار", "پارس", "پاناسونیک"
];

export function extractBrand(title) {
  if (!title || typeof title !== 'string' || !title.trim()) return 'متفرقه';

  const lower = title.toLowerCase();
  if (lower.includes('سامسونگ')) return 'سامسونگ';
  if (lower.includes('سام الکترونیک')) return 'سام الکترونیک';

  for (const brand of TOROB_BRANDS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return 'متفرقه';
}

export function extractSize(title) {
  if (!title || typeof title !== 'string') return 'نامشخص';

  const normalized = title
    .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d - '0'])
    .replace(/[\u200C\u200D]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/["']/g, '')
    .trim();

  const patterns = [
    /(\d{2,3})\s*اینچ/i,
    /(\d{2,3})\s*اینج/i,
    /سایز\s*(\d{2,3})/i,
    /اندازه\s*(\d{2,3})/i,
    /(\d{2,3})\s*["']?اینچ/i,
    /[\d۰-۹]{2,3}\s*اینچ/i,
    /سایز\s*[\d۰-۹]{2,3}\s*اینچ/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const sizeStr = match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      const num = parseInt(sizeStr, 10);
      if (num >= 32 && num <= 100) return num.toString();
    }
  }
  return 'نامشخص';
}

export function extractTech(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('q led')) return 'QLED';
  if (lower.includes('oled') || lower.includes('اولد')) return 'OLED';
  return 'LED';
}

export function processTorobItem(item) {
  const title = String(item['ProductCard_desktop_product-name__JwqeK'] ?? '').trim();
  const brand = extractBrand(title);
  const size = extractSize(title);
  const tech = extractTech(title);

  let price_num = parseInt(
    String(item['ProductCard_desktop_product-price-text__y20OV'] ?? '0')
      .replace(/[^0-9۰-۹]/g, '')
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  ) || 0;

  let sellers = parseInt(
    String(item['ProductCard_desktop_shops__mbtsF'] ?? '0')
      .replace(/[^0-9۰-۹]/g, '')
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  ) || 0;

  const link = item['ProductCards_cards__MYvdn href'] ?? '#';

  if (price_num <= 0) return null;

  return { name: title || 'نام محصول نامشخص', brand, link, price_num, sellers, size, tech };
}

export function processDigikalaItem(item) {
  const title = item['ellipsis-2'] || 'نامشخص';
  const brand = extractBrand(title);
  const size = extractSize(title);
  const tech = extractTech(title);
  let price_num = parseInt(
    (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  ) || 0;
  let original_price_num = parseInt(
    (item['text-neutral-300'] || '0').toString().replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  ) || 0;

  return {
    name: title,
    brand,
    link: item['block href'] || '#',
    stock: item['text-caption'] || 'نامشخص',
    rating: item['text-body2-strong'] || '—',
    discount: item['text-body2-strong (2)'] || '—',
    price_num,
    original_price_num,
    sellers: /موجود|باقی مانده/i.test(item['text-caption'] || '') ? 1 : 0,
    size,
    tech
  };
}
