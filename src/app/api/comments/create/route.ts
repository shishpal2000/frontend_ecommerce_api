import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const commented_by = formData.get('commented_by') as string;
    const actual_comment = formData.get('actual_comment') as string;
    const interpreted_comment = formData.get('interpreted_comment') as string;
    const video = formData.get('video') as File;
    const image = formData.get('image') as File;

    if (!commented_by || !actual_comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let videoPath: string | undefined;
    let imagePath: string | undefined;

    // Handle video upload
    if (video) {
      const bytes = await video.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${video.name}`;
      const filePath = join(process.cwd(), 'public', 'uploads', 'videos', fileName);
      await writeFile(filePath, buffer);
      videoPath = `/uploads/videos/${fileName}`;
    }

    // Handle image upload
    if (image) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${image.name}`;
      const filePath = join(process.cwd(), 'public', 'uploads', 'images', fileName);
      await writeFile(filePath, buffer);
      imagePath = `/uploads/images/${fileName}`;
    }

    // Here you would typically save to your database
    // For now, we'll just return the data
    const commentData = {
      id: Date.now().toString(),
      commented_by,
      actual_comment,
      interpreted_comment,
      video: videoPath,
      image: imagePath,
    };

    return NextResponse.json(commentData);
  } catch (error) {
    console.error('Error processing comment:', error);
    return NextResponse.json(
      { error: 'Error processing comment' },
      { status: 500 }
    );
  }
}
