import { NextResponse } from 'next/server';
import {  MOCK_ENABLED } from '@/app/constants';

export async function POST(request: Request) {
  try {
    const { prompt, workflow, mode, fileName, serverUrl, hiRez } = await request.json();
    //напиши функцию которая удалит из prompt все двойные кавычки и знаки переноса сатрок (сделает безопасным для json)
    const cleanPrompt = prompt.replace(/"/g, '').replace(/\n/g, ' ').trim();
    let workflowStr = JSON.stringify(workflow);
    workflowStr = workflowStr.replace('PROMPT_PLACEHOLDER', cleanPrompt);
    workflowStr = workflowStr.replace('SEED_PLACEHOLDER', Math.floor(Math.random() * 100000).toString());
    // Для мока возвращаем заглушки с базовыми данными
    if (MOCK_ENABLED) {
      // Generate random index between 0 and 14 for mock data
      const randomIndex = Math.floor(Math.random() * 15);
      console.log('Using mock response', { mode });
      let prompt_id = '';
      
      if (mode === 'text2image') {
        prompt_id = `scene${randomIndex}`;
      } else if (mode === 'image2video') {
        // Извлекаем номер файла из пути (если есть)
        const fileNameMatch = fileName ? fileName.match(/scene_(\d+)/) : null;
        const fileIndex = fileNameMatch ? fileNameMatch[1] : randomIndex;
        prompt_id = hiRez 
          ? `clip${fileIndex}_video_hd` // для HD видео
          : `clip${fileIndex}_video`;   // для обычного видео
      }
      
      console.log('Mock prompt_id generated:', prompt_id);
      return NextResponse.json({ prompt_id });
    }

    // Реальная логика запроса к API ComfyUI
    console.log(`Preparing ${mode} generation`, { serverUrl: serverUrl , hiRez });
    const apiUrl = `${serverUrl }/prompt`;

     if (mode === "image2video") {
      workflowStr = workflowStr.replace('IMG_PLACEHOLDER', `https://s3.ru1.storage.beget.cloud/88095fdffa8e-tidy-trish/gen/txt2img/${fileName}`);
    }
    const workflowTosend = JSON.parse(workflowStr);
    console.log('ComfyUI workflow string:', JSON.stringify(workflowTosend, null, 2));
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflowTosend }),
    });

    // Проверяем статус ответа
    if (!response.ok) {
      throw new Error(`ComfyUI API вернул ошибку: ${response.status} ${response.statusText}`);
    }

    console.log('ComfyUI response status:', response.status);
    // Получаем JSON данные из ответа (только один раз)
    const result = await response.json();
    console.log('Результат генерации изображения/видео:', result);
    
    return NextResponse.json({ prompt_id: result.prompt_id });

  } catch (error) {
    console.error('Ошибка при генерации изображения:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при генерации изображения', details: (error as Error).message },
      { status: 500 }
    );
  }
}
