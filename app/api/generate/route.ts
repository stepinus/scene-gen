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
        s3_paths?: string[];
        [key: string]: unknown;
      };
    };
    [key: string]: unknown;
  };
}

// Функция для поллинга и парсинга результатов
async function pollAndParseResults(
  serverUrl: string,
  prompt_id: string
): Promise<{ imageUrl: string | null; videoUrl: string | null }> {
  const maxRetries = Math.floor(GENERATION_TIMEOUT_MS / POLLING_INTERVAL_MS);
  let attempts = 0;

  console.log(`Starting polling for prompt_id: ${prompt_id}`);

  while (attempts < maxRetries) {
    try {
      console.log(`Polling attempt ${attempts + 1}/${maxRetries}`);

      const historyResponse = await fetch(`${serverUrl}/history/${prompt_id}`);

      if (!historyResponse.ok) {
        console.warn(`History API returned ${historyResponse.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        attempts++;
        continue;
      }
      
      const responseText = await historyResponse.text();
       if (!responseText || responseText.trim() === '') {
        console.log('Empty response, continuing polling...');
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        attempts++;
        continue;
      }

      const historyData: ComfyHistoryResponse = JSON.parse(responseText);

      const promptHistory = historyData[prompt_id];
      if (!promptHistory || !promptHistory.outputs) {
        console.log('No data or outputs for prompt_id yet, continuing polling...');
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        attempts++;
        continue;
      }
      
      console.log('Full history response:', JSON.stringify(historyData, null, 2));

      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      for (const nodeId in promptHistory.outputs) {
        const nodeOutput = promptHistory.outputs[nodeId];
        if (nodeOutput && Array.isArray(nodeOutput.s3_paths) && nodeOutput.s3_paths.length > 0) {
            const path = nodeOutput.s3_paths[0];
            if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
                imageUrl = `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/${path}`;
            } else if (path.endsWith('.mp4') || path.endsWith('.webm')) {
                videoUrl = `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/${path}`;
            }
        }
      }

      if (imageUrl && videoUrl) {
        console.log(`Found results: image=${imageUrl}, video=${videoUrl}`);
        return { imageUrl, videoUrl };
      }
      
      console.log('Not all results found yet, continuing polling...');

    } catch (error) {
      console.error('Error during polling:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    attempts++;
  }

  throw new Error(`Generation timeout after ${GENERATION_TIMEOUT_MS / 1000 / 60} minutes`);
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

    // Ждем результат генерации видео и изображения
    const { imageUrl, videoUrl } = await pollAndParseResults(serverUrl, videoPromptId);

    if (!imageUrl || !videoUrl) {
      throw new Error('Failed to retrieve generated image and video URLs.');
    }

    console.log('Generation completed:', { imageUrl, videoUrl });

    // Возвращаем результаты
    return NextResponse.json({
      image: imageUrl, // URL сгенерированного изображения
      video: videoUrl, // URL сгенерированного видео
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