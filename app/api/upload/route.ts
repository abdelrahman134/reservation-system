import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    for (const file of files) {
      if (typeof file === 'object' && 'name' in file) {
        const url = await saveUploadedFile(file);
        uploadedUrls.push(url);
      }
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
