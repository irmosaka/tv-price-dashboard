import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'products.json');

export async function GET() {
  try {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      const products = JSON.parse(data);
      
      return NextResponse.json({
        success: true,
        count: products.length,
        products: products
      });
    } catch (error) {
      // اگر فایل وجود نداشت
      return NextResponse.json({
        success: true,
        count: 0,
        products: []
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
