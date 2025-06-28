import { NextRequest, NextResponse } from 'next/server'
import { ComfyWorkflow, getComfyWorkflow } from '@/lib/workflow'

async function prepareWorkflow(imageUrl: string, text: string): Promise<ComfyWorkflow> {
  // Получаем базовый workflow
  const workflow: ComfyWorkflow = await getComfyWorkflow()

  // Находим узел загрузки изображения в workflow
  const loadImageNode = Object.values(workflow).find(node =>
    node.class_type === 'LoadImage'
  )

  // Заменяем плейсхолдер изображения на реальный URL
  if (loadImageNode) {
    loadImageNode.inputs.image = imageUrl
  }

  // Находим текстовые узлы для вставки текста
  const textNodes = Object.values(workflow).filter(node =>
    node.class_type === 'CLIPTextEncode'
  )

  // Вставляем текст в каждый текстовый узел
  if (textNodes.length > 0) {
    textNodes.forEach(node => {
      if (node.inputs) {
        node.inputs.text = text
      }
    })
  }

  return workflow
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const text = formData.get('text')?.toString()
    const imageUrl = formData.get('imageUrl')?.toString()
    const serverUrl = formData.get('serverUrl')?.toString() || process.env.COMFYUI_SERVER_URL

    if (!text) {
      return NextResponse.json(
        { error: 'Текст обязателен' },
        { status: 400 }
      )
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL изображения обязателен' },
        { status: 400 }
      )
    }

    // Получаем workflow с замененными значениями
    const workflow = await prepareWorkflow(imageUrl, text)

    // Если указан ComfyUI сервер, отправляем туда запрос
    if (serverUrl) {
      console.log("Итоговый workflow для отправки на сервер:", JSON.stringify(workflow, null, 2));
      try {
        const comfyResponse = await fetch(`${serverUrl}/prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: workflow,
            client_id: 'ai-video-generator',
          }),
        })

        if (!comfyResponse.ok) {
          throw new Error('Ошибка ComfyUI API')
        }

        const comfyData = await comfyResponse.json()

        // Здесь мы можем добавить логику ожидания результата от ComfyUI
        // Для простоты вернем заглушки
        return NextResponse.json({
          image: 'https://example.com/generated-image.jpg',
          video: 'https://example.com/generated-video.mp4',
          workflowResponse: comfyData
        })
      } catch (error) {
        console.error('Ошибка ComfyUI:', error)
        return NextResponse.json(
          { error: 'Ошибка при вызове ComfyUI API', details: error instanceof Error ? error.message : 'Неизвестная ошибка' },
          { status: 500 }
        )
      }
    }

    // Если ComfyUI сервер не указан, используем демонстрационный режим
    return NextResponse.json({
      image: 'https://example.com/demo-image.jpg',
      video: 'https://example.com/demo-video.mp4',
      isDemo: true
    })

  } catch (error) {
    console.error('Ошибка обработки запроса:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке запроса', details: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    )
  }
}