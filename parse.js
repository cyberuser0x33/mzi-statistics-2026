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

        // Получаем сырой массив объектов
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const students = [];

        rawData.forEach((row) => {
            const studentId = row['__EMPTY_1'];
            const studentName = row['__EMPTY_2'];
            const studyProgram = row['__EMPTY_3'];
            const totalPoints = row['__EMPTY_4'];
            const lectureAttendance = row['__EMPTY_35'];
            const activityPoints = row['__EMPTY_36'];

            // Мягкая проверка ID: переводим в число и проверяем, что это не заголовок
            const numericId = Number(studentId);

            if (studentId !== '' && studentId !== undefined && !isNaN(numericId) && numericId > 0) {
                students.push({
                    id: numericId,
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
            throw new Error('Не удалось найти ни одного студента в файле Excel!');
        }

        // Сохраняем массив студентов
        fs.writeFileSync('data.json', JSON.stringify(students, null, 2), 'utf-8');

        // Генерируем время по Братиславе
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

        console.log(`Успешно! Сохранено студентов: ${students.length}, время (Братислава): ${syncTimeStr}`);

    } catch (error) {
        console.error('Ошибка при обработке:', error.message);
        process.exit(1);
    }
}

updateData();