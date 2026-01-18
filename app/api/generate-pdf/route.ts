import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const { html, fileName } = await request.json(); // Receive the custom name from client

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // This header tells the browser to download with THIS name
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Puppeteer Error:", error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}