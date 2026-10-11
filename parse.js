const fs = require('fs');
const XLSX = require('xlsx');

async function updateData() {
    const targetUrl = 'https://ics.upjs.sk/~krajci/skola/vyucba/jesen/jesen-hodnotenie.xlsx';
    
    try {
        console.log('Скачивание файла...');
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Получаем точную исходную структуру XLSX
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Сохраняем ровно тот массив, который ожидает фронтенд
        fs.writeFileSync('data.json', JSON.stringify(jsonData, null, 2), 'utf-8');
        console.log('Файл data.json успешно обновлен!');

        // Время синхронизации по Братиславе
        const now = new Date();
        const options = {
            timeZone: 'Europe/Bratislava',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const syncTimeStr = now.toLocaleString('en-GB', options).replace(',', '');
        fs.writeFileSync('sync.txt', syncTimeStr, 'utf-8');

        console.log(`Время синхронизации (Братислава): ${syncTimeStr}`);

    } catch (error) {
        console.error('Ошибка при обработке:', error.message);
        process.exit(1);
    }
}

updateData();