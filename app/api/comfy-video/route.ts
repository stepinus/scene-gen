import { NextResponse } from 'next/server';

const TIMEOUT_MS = 15 * 60 * 1000;  // 15 минут
const POLLING_INTERVAL = 10000;      // 10 секунд
const MAX_RETRIES = Math.floor(TIMEOUT_MS / POLLING_INTERVAL);

interface WorkflowData {
  [key: string]: unknown;  
}

interface VideoRequest {
  sourceFileName: string;
  prompt: string;
  workflow: WorkflowData;
  serverUrl: string;
  hiRez?: boolean;
}

async function pollUntilComplete(
  serverUrl: string,
  prompt_id: string
): Promise<string> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    console.log(`Polling attempt ${attempts + 1}/${MAX_RETRIES}`);
    
    try {
      const response = await fetch(`${serverUrl}/history/${prompt_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`ComfyUI history API error: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        continue;
      }
      
      const data = JSON.parse(responseText);
      
      if (!data[prompt_id]) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        continue;
      }

      interface OutputNode {
        s3_paths?: string[];
        outputs?: Record<string, unknown>;
        [key: string]: unknown;
      }

      const findS3Path = (data: unknown, inOutputs: boolean = false): string | null => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const node = data as OutputNode;
          const isInOutputs = inOutputs || 'outputs' in node;
          
          if (isInOutputs && 
              node.s3_paths && 
              Array.isArray(node.s3_paths) && 
              node.s3_paths.length > 0) {
            return node.s3_paths[0];
          }
          
          for (const key in node) {
            const isCurrentInOutputs = isInOutputs || key === 'outputs';
            const result = findS3Path(node[key], isCurrentInOutputs);
            if (result) return result;
          }
        } 
        else if (Array.isArray(data)) {
          for (const item of data) {
            const result = findS3Path(item, inOutputs);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      const s3Path = findS3Path(data[prompt_id], false);
      if (s3Path) {
        return s3Path;
      }

    } catch (error) {
      console.error('Error during polling:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }

  throw new Error('Generation timeout after 15 minutes');
}

export async function POST(request: Request) {
  try {
    // Получаем и валидируем параметры
    const { sourceFileName, prompt, workflow, serverUrl, hiRez } = await request.json() as VideoRequest;
    
    if (!sourceFileName || !prompt || !workflow || !serverUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Подготавливаем данные для ComfyUI
    const cleanPrompt = prompt.replace(/"/g, '').replace(/\n/g, ' ').trim();
    let workflowStr = JSON.stringify(workflow);
    workflowStr = workflowStr.replace('PROMPT_PLACEHOLDER', cleanPrompt);
    workflowStr = workflowStr.replace('SEED_PLACEHOLDER', Math.floor(Math.random() * 1000000).toString());
    workflowStr = workflowStr.replace('IMG_PLACEHOLDER', `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/gen/txt2img/${sourceFileName}`);
    
    // Отправляем запрос на генерацию
    console.log('Starting video generation...', { hiRez });
    const apiUrl = `${serverUrl}/prompt`;
    
    const generateResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: JSON.parse(workflowStr) }),
    });

    if (!generateResponse.ok) {
      throw new Error(`ComfyUI API error: ${generateResponse.status} ${generateResponse.statusText}`);
    }

    const result = await generateResponse.json();
    console.log('Generation started, prompt_id:', result.prompt_id);

    // Ждем результат
    const generatedPath = await pollUntilComplete(serverUrl, result.prompt_id);
    
    // Формируем полный URL для видео
    const videoUrl = 'https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/' + generatedPath;
    
    return NextResponse.json({ fileName: videoUrl });

  } catch (error) {
    console.error('Error in video generation:', error);
    return NextResponse.json(
      { error: 'Video generation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
