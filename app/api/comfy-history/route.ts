/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { MOCK_ENABLED} from '@/app/constants';

// Store timers, results, and expiry times
const mockTimers: Record<string, number> = {};
const mockResults: Record<string, any> = {};
const mockResultsExpiry: Record<string, number> = {};
const seenPrompts: Set<string> = new Set();

export async function POST(request: Request) {
  try {
    if (MOCK_ENABLED) {
      const { prompt_id } = await request.json();

      const currentTime = Date.now();

      // Check if we need to reset the cycle due to expiry
      if (mockResultsExpiry[prompt_id] && currentTime > mockResultsExpiry[prompt_id]) {
        delete mockTimers[prompt_id];
        delete mockResults[prompt_id];
        delete mockResultsExpiry[prompt_id];
        seenPrompts.delete(prompt_id);
      }

      // First request or cycle reset for this prompt_id
      if (!seenPrompts.has(prompt_id)) {
        seenPrompts.add(prompt_id);
        mockTimers[prompt_id] = currentTime + 2000; // 10 second initial delay
        mockResultsExpiry[prompt_id] = currentTime + 30000; // 40 seconds total (10s delay + 30s availability)
        return NextResponse.json({});
      }

      // If still in initial delay period
      if (currentTime < mockTimers[prompt_id]) {
        return NextResponse.json({}); // Still in initial delay
      }

      // If we have a result and haven't expired yet, return it
      if (mockResults[prompt_id] && currentTime < mockResultsExpiry[prompt_id]) {
        return NextResponse.json(mockResults[prompt_id]);
      }

      // Generate result if we don't have one yet
      if (!mockResults[prompt_id]) {
        let result = null;

        // For video requests (ending with _video)
        if (prompt_id.endsWith('_video')) {
          const match = prompt_id.match(/clip(\d+)_video/);
          if (match) {
            const index = match[1];  // "004"
            result = {
              prompt_id,
              result: {
                outputs: {
                  images: [`clip${index}_thumb.png`]
                }
              }
            };
          }
        }
        // For image requests (ending with _img)
        else if (prompt_id.endsWith('_img')) {
          const match = prompt_id.match(/clip(\d+)_img/);
          if (match) {
            const index = match[1];  // "004"
            result = {
              prompt_id,
              result: {
                outputs: {
                  images: [`clip${index}_thumb.png`]
                }
              }
            };
          }
        }

        if (result) {
          // Store the result for future requests
          mockResults[prompt_id] = result;
          return NextResponse.json(result);
        }

        // If we couldn't generate a result, clean up
        seenPrompts.delete(prompt_id);
      }

      return NextResponse.json({});
    }
    // Non-mock mode
    const { prompt_id, mode, serverUrl } = await request.json();
    console.log('Prompt ID:', prompt_id);
    console.log('Mode:', mode);
    console.log('Request:', prompt_id);
    
    // Получаем данные от ComfyUI
    try {
      const response = await fetch(`${serverUrl}/history/${prompt_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.error(`ComfyUI history API вернул ошибку: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `ComfyUI вернул ошибку: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Проверяем текст ответа перед парсингом
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.log('ComfyUI вернул пустой ответ');
        return NextResponse.json({});
      }
      
      // Парсим JSON только если есть данные
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Результат генерации изображения/видео:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('Ошибка при парсинге JSON ответа:', parseError, 'Текст ответа:', responseText);
        return NextResponse.json(
          { error: 'Невозможно разобрать ответ от ComfyUI' },
          { status: 500 }
        );
      }

      if (!data[prompt_id]) {
        return NextResponse.json({});
      }

      // Функция для поиска filename в outputs независимо от структуры
      const findFilename = (data: any, fileType: string, inOutputs: boolean = false): string | null => {
        // Если data это объект
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Проверяем, находимся ли мы в поле outputs или его потомках
          const isInOutputs = inOutputs || Object.keys(data).includes('outputs');
          
          // Если мы находимся в outputs или его потомках и есть поле filename с нужным расширением
          // и при этом тип равен output
          if (isInOutputs && 
              data.filename && 
              typeof data.filename === 'string' && 
              data.filename.endsWith(fileType) &&
              data.type === 'output') {
            return data.filename;
          }

          // Рекурсивно ищем во всех полях объекта
          for (const key in data) {
            // Если текущий ключ - outputs или мы уже в структуре outputs
            const isCurrentInOutputs = isInOutputs || key === 'outputs';
            const result = findFilename(data[key], fileType, isCurrentInOutputs);
            if (result) return result;
          }
        } 
        // Если data это массив
        else if (Array.isArray(data)) {
          // Проходим по всем элементам массива
          for (const item of data) {
            const result = findFilename(item, fileType, inOutputs);
            if (result) return result;
          }
        }
        
        return null;
      };

      // Ищем filename в зависимости от режима
      if (mode === 'text2image') {
        const filename = findFilename(data[prompt_id], '.png', false);
        if (filename) {
          return NextResponse.json({ fileName: filename });
        } else {
          console.error('Не удалось найти filename в ответе в структуре outputs');
          return NextResponse.json(
            { error: 'Не удалось найти filename в ответе в структуре outputs' },
            { status: 500 }
          );
        }
      } else {
        // Для video режима ищем s3_paths в структуре outputs
        const findS3Path = (obj: any, inOutputs: boolean = false): string | null => {
          if (obj && typeof obj === 'object') {
            // Проверяем, находимся ли мы в поле outputs или его потомках
            const isInOutputs = inOutputs || Object.keys(obj).includes('outputs');
            
            // Если мы в outputs и есть s3_paths - возвращаем первый элемент
            if (isInOutputs && obj.s3_paths && Array.isArray(obj.s3_paths) && obj.s3_paths.length > 0) {
              return obj.s3_paths[0];
            }
            
            // Рекурсивно проверяем все ключи
            for (const key in obj) {
              const isCurrentInOutputs = isInOutputs || key === 'outputs';
              const result = findS3Path(obj[key], isCurrentInOutputs);
              if (result) return result;
            }
          }
          return null;
        };
        
        const s3Path = findS3Path(data[prompt_id], false);
        
        if (s3Path) {
          return NextResponse.json({ fileName: s3Path });
        } else {
          console.error('Не удалось найти s3_paths в ответе в структуре outputs');
          return NextResponse.json(
            { error: 'Не удалось найти s3_paths в ответе в структуре outputs' },
            { status: 500 }
          );
        }
      }
    } catch (fetchError) {
      console.error('Ошибка при запросе к ComfyUI history API:', fetchError);
      return NextResponse.json(
        { error: 'Ошибка при запросе к ComfyUI', details: (fetchError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса', details: (error as Error).message },
      { status: 500 }
    );
  }
}
