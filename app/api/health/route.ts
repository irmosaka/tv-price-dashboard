import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'TV Price Scraper API',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/scrape',
      '/api/products'
    ]
  });
}
