const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const { parseISO, isValid, isBefore, isAfter, format, addDays, startOfDay } = require('date-fns');

let mainWindow;

function updateRecommendDates() {
  try {
    const csvPath = path.join(__dirname, '..', 'public', 'question.csv'); 
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
      return { success: false, message: 'CSV 파일을 찾을 수 없습니다.' };
    }

    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    const today = startOfDay(new Date());
    const formattedToday = format(today, 'yyyy-MM-dd');

    const updatedData = parsed.data.map((row) => {
      const recommendDate = parseISO(row.recommenddate);
      const updateDate = parseISO(row.update);

      if (!isValid(recommendDate) || !isValid(updateDate)) {
        return row;
      }

      const recommendDateStart = startOfDay(recommendDate);
      const updateDateStart = startOfDay(updateDate);

      if (isBefore(recommendDateStart, today)) {
        if (isAfter(updateDateStart, today)) {
          return { ...row, recommenddate: format(updateDateStart, 'yyyy-MM-dd') };
        } else {
          return { ...row, recommenddate: formattedToday };
        }
      }

      return row;
    });

    const newCsv = Papa.unparse(updatedData);
    fs.writeFileSync(csvPath, newCsv, 'utf-8');

    console.log('recommenddate가 성공적으로 업데이트되었습니다.');
    return { success: true, message: 'recommenddate가 성공적으로 업데이트되었습니다.' };
  } catch (error) {
    console.error('Error updating recommend dates:', error);
    return { success: false, message: 'recommenddate 업데이트에 실패했습니다.' };
  }
}

function createWindow() {
  const updateResult = updateRecommendDates();
  if (!updateResult.success) {
    console.error(updateResult.message);
    // 필요에 따라 사용자에게 알림을 보내거나 애플리케이션을 종료할 수 있습니다.
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 보안 설정
      contextIsolation: true, // 보안 설정
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('http://localhost:3000'); // React 개발 서버 URL

  // 개발 중이라면 개발자 도구를 열 수 있습니다.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC 핸들러 추가: 'update-recommend-dates' 이벤트 처리
ipcMain.handle('update-recommend-dates', async () => {
  return updateRecommendDates();
});

// **추가된 IPC 핸들러들**

/**
 * 문제 정답 여부에 따라 question.csv 업데이트
 * data: { title: string, correctness: 'correct' | 'wrong' }
 */
ipcMain.handle('update-question', async (event, data) => {
  const { title, correctness } = data;
  const csvPath = path.join(__dirname, '..', 'public', 'question.csv');

  if (!fs.existsSync(csvPath)) {
    return { success: false, message: 'question.csv 파일을 찾을 수 없습니다.' };
  }

  const csvFile = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

  const today = startOfDay(new Date());
  const formattedToday = format(today, 'yyyy-MM-dd');

  const updatedData = parsed.data.map((row) => {
    if (row.title === title) {
      let newLevel = parseInt(row.level, 10);
      if (correctness === 'correct') {
        newLevel += 1;
      } else if (correctness === 'wrong') {
        newLevel -= 1;
        if (newLevel < 0) newLevel = 0; // 레벨이 0 미만으로 내려가지 않도록
      }

      // 레벨에 따른 updateDate 설정
      let daysToAdd;
      switch (newLevel) {
        case 0:
          daysToAdd = 1;
          break;
        case 1:
          daysToAdd = 2;
          break;
        case 2:
          daysToAdd = 3;
          break;
        default:
          daysToAdd = 4; // 레벨 3 이상은 +4일
          newLevel = 3; // 레벨을 3으로 고정
      }

      const newUpdateDate = addDays(today, daysToAdd);
      const formattedUpdateDate = format(newUpdateDate, 'yyyy-MM-dd');

      return {
        ...row,
        level: newLevel.toString(),
        update: formattedUpdateDate,
        solveddate: formattedToday,
      };
    }
    return row;
  });

  const newCsv = Papa.unparse(updatedData);
  fs.writeFileSync(csvPath, newCsv, 'utf-8');

  return { success: true, message: 'question.csv가 성공적으로 업데이트되었습니다.' };
});

/**
 * history.csv 업데이트
 * data: { correct: number, solved: number }
 */
ipcMain.handle('update-history', async (event, data) => {
  const { correct, solved } = data;
  const csvPath = path.join(__dirname, '..', 'public', 'history.csv');

  let historyData = [];
  if (fs.existsSync(csvPath)) {
    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    historyData = parsed.data;
  }

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const existingRowIndex = historyData.findIndex(row => row.date === today);

  if (existingRowIndex !== -1) {
    // 이미 오늘 날짜가 존재하면 업데이트
    const existingRow = historyData[existingRowIndex];
    const newSolvedCount = parseInt(existingRow.solvedCount, 10) + solved;
    const newCorrectCount = parseInt(existingRow.correctCount, 10) + correct;
    const newCorrectRate = newSolvedCount === 0 ? 0 : ((newCorrectCount / newSolvedCount) * 100).toFixed(2);

    historyData[existingRowIndex] = {
      date: today,
      solvedCount: newSolvedCount.toString(),
      correctCount: newCorrectCount.toString(),
      correctRate: newCorrectRate.toString(),
    };
  } else {
    // 오늘 날짜가 없으면 새로 추가
    const newCorrectRate = solved === 0 ? 0 : ((correct / solved) * 100).toFixed(2);
    historyData.push({
      date: today,
      solvedCount: solved.toString(),
      correctCount: correct.toString(),
      correctRate: newCorrectRate.toString(),
    });
  }

  const newCsv = Papa.unparse(historyData);
  fs.writeFileSync(csvPath, newCsv, 'utf-8');

  return { success: true, message: 'history.csv가 성공적으로 업데이트되었습니다.' };
});