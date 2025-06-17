import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ENABLED, GENERATION_TIMEOUT_MS, POLLING_INTERVAL_MS } from '@/app/constants'

// Интерфейсы для типизации
interface WorkflowData {
  [key: string]: unknown;
}



interface ComfyHistoryResponse {
  [prompt_id: string]: {
    outputs?: {
      [nodeId: string]: {
        filename?: string;
        s3_paths?: string[];
        type?: string;
        [key: string]: unknown;
      };
    };
    [key: string]: unknown;
  };
}

// Функция для поллинга результатов
async function pollForResult(
  serverUrl: string,
  prompt_id: string,
  mode: 'image2video'
): Promise<string> {
  const maxRetries = Math.floor(GENERATION_TIMEOUT_MS / POLLING_INTERVAL_MS);
  let attempts = 0;

  console.log(`Starting polling for prompt_id: ${prompt_id}, mode: ${mode}`);

  while (attempts < maxRetries) {
    try {
      console.log(`Polling attempt ${attempts + 1}/${maxRetries}`);

      const historyResponse = await fetch(`${serverUrl}/history/${prompt_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!historyResponse.ok) {
        console.warn(`History API returned ${historyResponse.status}, retrying...`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        continue;
      }

      const responseText = await historyResponse.text();
      if (!responseText || responseText.trim() === '') {
        console.log('Empty response, continuing polling...');
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        continue;
      }

      const historyData: ComfyHistoryResponse = JSON.parse(responseText);

      if (!historyData[prompt_id]) {
        console.log('No data for prompt_id yet, continuing polling...');
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        continue;
      }

      // Ищем результат в зависимости от режима
      const result = findResultInHistory(historyData[prompt_id], mode);
      if (result) {
        console.log(`Found result: ${result}`);
        return result;
      }

      console.log('No result found yet, continuing polling...');

    } catch (error) {
      console.error('Error during polling:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  throw new Error(`Generation timeout after ${GENERATION_TIMEOUT_MS / 1000 / 60} minutes`);
}

// Функция для поиска результата в истории ComfyUI
function findResultInHistory(
  historyEntry: ComfyHistoryResponse[string], 
  mode: 'image2video'
): string | null {
  const searchInObject = (obj: unknown, inOutputs: boolean = false): string | null => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = searchInObject(item, inOutputs);
          if (result) return result;
        }
      }
      return null;
    }

    const nodeData = obj as { [key: string]: unknown };
    const isInOutputs = inOutputs || 'outputs' in nodeData;

    // Для image2video ищем s3_paths
    if (mode === 'image2video' && isInOutputs) {
      if (Array.isArray(nodeData.s3_paths) && nodeData.s3_paths.length > 0) {
        return nodeData.s3_paths[0] as string;
      }
    }

    // Рекурсивно ищем во всех полях
    for (const key in nodeData) {
      const isCurrentInOutputs = isInOutputs || key === 'outputs';
      const result = searchInObject(nodeData[key], isCurrentInOutputs);
      if (result) return result;
    }

    return null;
  };

  return searchInObject(historyEntry, false);
}

// Функция для подготовки workflow
function prepareWorkflow(
  workflow: WorkflowData,
  prompt: string,
  imageFileName: string
): WorkflowData {
  const cleanPrompt = prompt.replace(/"/g, '').replace(/\n/g, ' ').trim();
  let workflowStr = JSON.stringify(workflow);

  // Заменяем плейсхолдеры
  workflowStr = workflowStr.replace(/PROMPT_PLACEHOLDER/g, cleanPrompt);
  workflowStr = workflowStr.replace(/SEED_PLACEHOLDER/g, Math.floor(Math.random() * 1000000).toString());

  // Добавляем путь к загруженному пользователем изображению
  const imageUrl = `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/uploads/${imageFileName}`;
  workflowStr = workflowStr.replace(/IMG_PLACEHOLDER/g, imageUrl);

  return JSON.parse(workflowStr);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const text = formData.get('text') as string
    const serverUrl = formData.get('serverUrl') as string
    const comfyPipeline = formData.get('comfyPipeline') as string

    if (!image || !text) {
      return NextResponse.json(
        { error: 'Изображение и текст обязательны' },
        { status: 400 }
      )
    }

    // Мок режим для тестирования
    if (MOCK_ENABLED || !serverUrl || !comfyPipeline) {
      console.log('Using mock mode');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Симуляция обработки

      return NextResponse.json({
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
        video: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      });
    }

    // Парсим workflow
    let workflow: WorkflowData;
         try {
       workflow = JSON.parse(comfyPipeline);
     } catch {
       return NextResponse.json(
         { error: 'Некорректный JSON workflow' },
         { status: 400 }
       );
     }

    console.log('Starting ComfyUI video generation process...');

    // Загружаем пользовательское изображение на сервер (если нужно)
    // Здесь можно добавить логику загрузки изображения на ваш S3 или передачи в ComfyUI
    
    // Генерация видео из загруженного пользователем изображения
    console.log('Generating video from user uploaded image...');
    
    // Создаем уникальное имя файла для загруженного изображения
    const imageFileName = `user_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${image.name.split('.').pop()}`;
    
    // В реальной реализации здесь нужно загрузить изображение на ваш S3
    // Пока используем placeholder для демонстрации
    const uploadedImageUrl = `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/uploads/${imageFileName}`;
    
    const videoWorkflow = prepareWorkflow(workflow, text, imageFileName);
    
    const videoGenerateResponse = await fetch(`${serverUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: videoWorkflow, "extra_data": {
        "api_key_comfy_org": "comfyui-b12f29edf1d68bed86e7c1087421bd06feda39499e147e31314f59099a4c06d6",
    }, }),
    });

    if (!videoGenerateResponse.ok) {
      throw new Error(`ComfyUI video generation failed: ${videoGenerateResponse.status}`);
    }

    const videoResult = await videoGenerateResponse.json();
    const videoPromptId = videoResult.prompt_id;
    console.log('Video generation started, prompt_id:', videoPromptId);

    // Ждем результат генерации видео
    const videoS3Path = await pollForResult(serverUrl, videoPromptId, 'image2video');
    const videoUrl = `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/${videoS3Path}`;
    console.log('Video generation completed:', videoUrl);

    // Возвращаем результаты
    return NextResponse.json({
      image: uploadedImageUrl, // URL загруженного пользователем изображения
      video: videoUrl,         // URL сгенерированного видео
      videoPromptId
    });

  } catch (error) {
    console.error('Error in ComfyUI generation:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при генерации', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 