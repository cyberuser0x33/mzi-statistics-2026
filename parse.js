const fs = require('fs');
const https = require('https');
const XLSX = require('xlsx');

const excelUrl = 'https://ics.upjs.sk/~krajci/skola/vyucba/jesen/jesen-hodnotenie.xlsx';

function parseExcel() {
    console.log(`Загрузка файла: ${excelUrl}`);

    const req = https.get(excelUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }, (res) => {
        if (res.statusCode !== 200) {
            console.error(`Ошибка загрузки: статус ${res.statusCode}`);
            process.exit(1);
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));

        res.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Читаем как массив массивов (строк) без привязки к заголовкам
                const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                const rawObjects = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                console.log(`Всего строк в файле: ${rawRows.length}`);

                const students = [];

                // Парсинг через поиск колонок по строкам
                rawRows.forEach((rowArray, idx) => {
                    if (!Array.isArray(rowArray) || rowArray.length < 2) return;

                    const studentIdRaw = rowArray[1]; // Вторая колонка
                    const parsedId = Number(studentIdRaw);

                    if (studentIdRaw !== '' && !isNaN(parsedId) && parsedId > 0 && parsedId < 1000) {
                        const studentName = rowArray[2] ? String(rowArray[2]).trim() : '';
                        const studyProgram = rowArray[3] ? String(rowArray[3]).trim() : '';
                        const totalPoints = rowArray[4] !== '' ? Number(rowArray[4]) : 0;
                        const lectureAttendance = rowArray[35] !== '' ? Number(rowArray[35]) : 0;
                        const activityPoints = rowArray[36] !== '' ? Number(rowArray[36]) : 0;

                        // Находим соответствие с объектом raw
                        const matchedRawObj = rawObjects.find(o => Number(o['__EMPTY_1']) === parsedId) || {};

                        students.push({
                            id: parsedId,
                            name: studentName,
                            studyProgram: studyProgram,
                            totalPoints: isNaN(totalPoints) ? 0 : totalPoints,
                            lectureAttendance: isNaN(lectureAttendance) ? 0 : lectureAttendance,
                            activityPoints: isNaN(activityPoints) ? 0 : activityPoints,
                            raw: matchedRawObj
                        });
                    }
                });

                if (students.length === 0) {
                    console.log('Пример первых 3 строк файла для отладки:', rawRows.slice(0, 3));
                    throw new Error('Обработка завершена, но найдено 0 студентов!');
                }

                // Сохранение в data.json
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

                console.log(`Успешно! Найдено студентов: ${students.length}, Время: ${syncTimeStr}`);

            } catch (err) {
                console.error('Ошибка при распарсивании:', err.message);
                process.exit(1);
            }
        });
    });

    req.on('error', (err) => {
        console.error('Ошибка сети:', err.message);
        process.exit(1);
    });
}

parseExcel();