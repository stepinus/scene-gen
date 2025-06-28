import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
  },
  forcePathStyle: true,
})

const bucketName = '88095fdffa8e-tidy-trish'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Изображение обязательно' },
        { status: 400 }
      )
    }

    const fileExtension = imageFile.name.split('.').pop()
    const fileKey = `${uuidv4()}.${fileExtension}`

    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: Buffer.from(await imageFile.arrayBuffer()),
      ContentType: imageFile.type,
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    const imageUrl = `https://${bucketName}.s3.ru1.storage.beget.cloud/${fileKey}`

    return NextResponse.json({
      imageUrl: imageUrl
    })

  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке изображения', details: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    )
  }
}