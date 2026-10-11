const fs = require('fs');
const XLSX = require('xlsx');

async function parseExcel() {
    try {
        const url = 'https://ics.upjs.sk/~krajci/skola/vyucba/jesen/jesen-hodnotenie.xlsx';
        console.log(`Загрузка файла с ${url}...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Не удалось загрузить файл: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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

        console.log(`Успешно обработано студентов: ${students.length}`);

        // Запись файла с данными студентов
        fs.writeFileSync('data.json', JSON.stringify(students, null, 2), 'utf-8');

        // Время синхронизации по часовому поясу Братиславы
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

        console.log(`Время синхронизации: ${syncTimeStr}`);

    } catch (error) {
        console.error('Ошибка в процессе работы парсера:', error);
        process.exit(1);
    }
}

parseExcel();