const fs = require('fs');
const XLSX = require('xlsx');

async function updateData() {
    const targetUrl = 'https://ics.upjs.sk/~krajci/skola/vyucba/jesen/jesen-hodnotenie.xlsx';

    try {
        console.log('Скачивание файла...');
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Превращаем буфер в воркбук SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Конвертируем лист в массив объектов JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Сохраняем в файл data.json
        fs.writeFileSync('data.json', JSON.stringify(jsonData, null, 2), 'utf-8');
        console.log('Файл data.json успешно обновлен!');
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        process.exit(1);
    }
}

updateData();
