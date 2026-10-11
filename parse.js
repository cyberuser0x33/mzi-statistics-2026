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

        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const students = [];

        rawData.forEach((row) => {
            // Ищем колонку с ID студента (первое чисельное значение 1..999 в объекте)
            const keys = Object.keys(row);
            
            // Находим ID (обычно первая или вторая колонка с числом)
            const idKey = keys.find(k => {
                const val = Number(row[k]);
                return !isNaN(val) && val > 0 && val < 200 && String(row[k]).trim() !== '';
            });

            if (idKey) {
                const numericId = Number(row[idKey]);
                
                // Имя идет в следующей колонке после ID
                const idIndex = keys.indexOf(idKey);
                const nameKey = keys[idIndex + 1];
                const programKey = keys[idIndex + 2];
                const totalKey = keys[idIndex + 3];

                const studentName = nameKey && row[nameKey] ? String(row[nameKey]).trim() : '';
                const studyProgram = programKey && row[programKey] ? String(row[programKey]).trim() : '';
                const totalPoints = totalKey && row[totalKey] !== '' ? Number(row[totalKey]) : 0;

                // Пропускаем строки шапки, если имя совпадает с техническими словами
                if (studentName && studentName !== 'známka' && studentName !== 'AIS') {
                    students.push({
                        id: numericId,
                        name: studentName,
                        studyProgram: studyProgram,
                        totalPoints: isNaN(totalPoints) ? 0 : totalPoints,
                        lectureAttendance: Number(row['__EMPTY_35'] || 0),
                        activityPoints: Number(row['__EMPTY_36'] || 0),
                        raw: row
                    });
                }
            }
        });

        if (students.length === 0) {
            console.log('Пример первой строки для отладки:', rawData[0]);
            throw new Error('Не удалось найти ни одного студента в файле Excel!');
        }

        // Сохраняем массив
        fs.writeFileSync('data.json', JSON.stringify(students, null, 2), 'utf-8');

        // Время по Братиславе
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

        console.log(`Успешно! Сохранено студентов: ${students.length}, время: ${syncTimeStr}`);

    } catch (error) {
        console.error('Ошибка при обработке:', error.message);
        process.exit(1);
    }
}

updateData();