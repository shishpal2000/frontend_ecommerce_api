import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'video' or 'image'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the file to your actual storage service (S3, Azure, etc.)
    // 2. Get back the URL of the uploaded file
    // For now, we'll simulate this with a mock URL
    const mockUrl = `/api/media/${type}/${Date.now()}-${file.name}`;

    return NextResponse.json({ url: mockUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
