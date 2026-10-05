const fs = require('fs');
const XLSX = require('xlsx');

async function updateData() {
    const targetUrl = 'https://ics.upjs.sk/~krajci/skola/vyucba/jesen/jesen-hodnotenie.xlsx';

    try {
        const usersRaw = fs.readFileSync('users.txt', 'utf-8');
        
        // Разбираем users.txt по строкам (Имя | Специальность)
        const usersList = usersRaw
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split('|');
                return {
                    name: parts[0] ? parts[0].trim() : '',
                    studyProgram: parts[1] ? parts[1].trim() : 'N/A'
                };
            });

        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Upload error: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet);

        // Отбираем только строки студентов (где __EMPTY является числом 1, 2, ..., 121)
        const studentRows = rawJsonData.filter(row => typeof row.__EMPTY === 'number');

        // Сопоставляем порядок из .xlsx с порядка в users.txt
        const resultData = studentRows.map((row, index) => {
            const userMeta = usersList[index] || { name: 'Неизвестно', studyProgram: 'N/A' };

            return {
                id: row.__EMPTY,
                name: userMeta.name,
                studyProgram: userMeta.studyProgram,
                grade: row.známka || 'F',
                totalPoints: row.spolu || 0,
                homeworkPoints: row.body || 0,
                lectureAttendance: row.prednášky || 0,
                activityPoints: row.__EMPTY_27 || row.__EMPTY_3 || 0,
                // Сохраняем исходные поля для работы с детальными заданиями по неделям
                raw: row
            };
        });

        // Записываем итоговый файл data.json
        fs.writeFileSync('data.json', JSON.stringify(resultData, null, 2), 'utf-8');
        console.log(`Успешно обработано ${resultData.length} записей студентов и сохранено в data.json!`);

    } catch (error) {
        console.error('Ошибка при обновлении:', error);
        process.exit(1);
    }
}

updateData();