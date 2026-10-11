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

                const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                const students = [];

                rawData.forEach((row) => {
                    const studentId = row['__EMPTY_1'];
                    const studentName = row['__EMPTY_2'];
                    const studyProgram = row['__EMPTY_3'];
                    const totalPoints = row['__EMPTY_4'];
                    const lectureAttendance = row['__EMPTY_35'];
                    const activityPoints = row['__EMPTY_36'];

                    if (studentId && typeof studentId === 'number') {
                        students.push({
                            id: studentId,
                            name: studentName ? String(studentName).trim() : '',
                            studyProgram: studyProgram ? String(studyProgram).trim() : '',
                            totalPoints: totalPoints !== '' ? Number(totalPoints) : 0,
                            lectureAttendance: lectureAttendance !== '' ? Number(lectureAttendance) : 0,
                            activityPoints: activityPoints !== '' ? Number(activityPoints) : 0,
                            raw: row
                        });
                    }
                });

                if (students.length === 0) {
                    throw new Error('Обработка завершена, но найдено 0 студентов!');
                }

                // Сохранение массива студентов в data.json
                fs.writeFileSync('data.json', JSON.stringify(students, null, 2), 'utf-8');

                // Формирование времени по Братиславе
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