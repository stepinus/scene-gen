import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

// Конфигурация S3 клиента
const s3Client = new S3Client({
  endpoint: 'https://s3.ru1.storage.beget.cloud',
  region: 'ru1',
  credentials: {
    accessKeyId: '2AW9J3CAJ9V8V0M7SUZQ',
    secretAccessKey: 'NkCJqVEZN1D5t1q5LXTuU8g0ToWOncWAI1frFdIB',
  },
  forcePathStyle: true, // Обязательно для MinIO и других S3-совместимых хранилищ
})

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

    // Генерируем уникальное имя файла
    const fileExtension = imageFile.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const bucketName = '88095fdffa8e-tidy-trish'

    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Загружаем файл в S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: imageFile.type,
      ACL: 'public-read', // Делаем файл публично доступным
    })

    await s3Client.send(putObjectCommand)

    // Формируем URL для доступа к файлу
    // URL-формат может отличаться в зависимости от вашего S3-провайдера
    const imageUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${fileName}`

    console.log(`Файл успешно загружен в S3: ${imageUrl}`)

    return NextResponse.json({
      imageUrl: imageUrl,
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения в S3:', error)
    return NextResponse.json(
      {
        error: 'Ошибка при загрузке изображения',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    )
  }
} 