import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filePath = path.join(process.cwd(), 'docs', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Set appropriate headers based on file type
    const headers = new Headers();
    if (filename.endsWith('.pdf')) {
      headers.set('Content-Type', 'application/pdf');
    }

    headers.set('Content-Disposition', `inline; filename="${filename}"`);

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
