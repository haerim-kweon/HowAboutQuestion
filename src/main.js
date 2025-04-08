require("dotenv").config();

const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const archiver = require("archiver");
const os = require('os');
const extract = require('extract-zip'); // 압축 해제 모듈

// 실행 파일의 디렉토리 경로 (배포 후 실행파일 위치)
// const exeDir = path.dirname(app.getPath('exe'));

const exeDir = app.getPath('userData');

const questionsCsvPath = path.join(exeDir, 'questions.csv');
const historyCsvPath = path.join(exeDir, 'history.csv');

// const questionsCsvPath = "./public/question.csv";
// const historyCsvPath = "./public/history.csv";


console.log("questionsCsvPath:", questionsCsvPath);
console.log("historyCsvPath:", historyCsvPath);

const { parseISO, isValid, isBefore, isAfter, format, startOfDay, addDays } = require('date-fns');

let mainWindow;


const getTodayDate = () => {
  const offset = 1000 * 60 * 60 * 9;
  return new Date((new Date()).getTime() + offset).toISOString().split("T")[0];
};

function generateUniqueId(questions) {
  const generateRandomId = () => {
    return `id-${Math.random().toString(36).slice(2, 11)}`;
  };

  let newId;
  do {
    newId = generateRandomId();
  } while (Array.isArray(questions) && questions.some(question => question?.id === newId));

  return newId;
}

// CSV 파일을 읽어서 데이터 처리하는 함수
function readQuestionsCSV() {
  try {
    const csvPath = questionsCsvPath;

    if (!fs.existsSync(csvPath)) {
      console.error(`readQuestionsCSV CSV 파일을 찾을 수 없습니다: ${csvPath}`);
      return { success: false, message: 'CSV 파일을 찾을 수 없습니다.' };
    }

    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    var questions = [];
    const tagSet = new Set();

    Papa.parse(csvFile, {
      header: true, // 첫 줄을 헤더로 사용
      skipEmptyLines: true, // 빈 줄 무시
      complete: (result) => {
        questions = result.data.map((item, index) => {
          if (item.tag) item.tag = (item.tag).split(",").map((t) => t.trim());
          else item.tag = [];

          item.tag.forEach((t) => tagSet.add(t)); // 태그 집합에 추가

          item.id = generateUniqueId();
          item.checked = false;
          return item;
        });
      },
    });

    return { success: true, allTag: [...tagSet], questions: questions, message: 'questions 읽기 성공' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'questions 읽기 실패' };
  }
}


function updateRecommendDates() {
  try {
    const csvPath = questionsCsvPath;

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
      return { success: false, message: 'CSV 파일을 찾을 수 없습니다.' };
    }

    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    const today = getTodayDate(); // 수정된 부분
    const todayDate = parseISO(today); // 오늘 날짜를 Date 객체로 변환

    const updatedData = parsed.data.map((row) => {
      const recommendDate = parseISO(row.recommenddate);
      const updateDate = parseISO(row.update);

      if (!isValid(recommendDate) || !isValid(updateDate)) {
        return row;
      }

      if (isBefore(startOfDay(recommendDate), todayDate)) {
        if (isAfter(startOfDay(updateDate), todayDate)) {
          return { ...row, recommenddate: format(updateDate, 'yyyy-MM-dd') };
        } else {
          return { ...row, recommenddate: today };
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


// history.csv를 업데이트하는 함수
function updateHistory(isCorrect) {
  try {
    const today = getTodayDate(); // 수정된 부분

    if (!fs.existsSync(historyCsvPath)) {
      const initialData = [
        {
          date: today,
          solvedCount: 1,
          correctCount: isCorrect ? 1 : 0,
          correctRate: isCorrect ? 100.0 : 0.0,
        },
      ];
      const csv = Papa.unparse(initialData);
      fs.writeFileSync(historyCsvPath, csv, 'utf-8');
      console.log(`history.csv에 새로운 날짜(${today}) 기록이 추가되었습니다.`);
      return;
    }

    const csvFile = fs.readFileSync(historyCsvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    let rowFound = false;
    const updatedData = parsed.data.map((row) => {
      if (row.date === today) {
        row.solvedCount = parseInt(row.solvedCount, 10) + 1;
        if (isCorrect) {
          row.correctCount = parseInt(row.correctCount, 10) + 1;
        }
        row.correctRate = ((row.correctCount / row.solvedCount) * 100).toFixed(2);
        rowFound = true;
      }
      return row;
    });

    if (!rowFound) {
      updatedData.push({
        date: today,
        solvedCount: 1,
        correctCount: isCorrect ? 1 : 0,
        correctRate: isCorrect ? '100.00' : '0.00',
      });
    }

    const newCsv = Papa.unparse(updatedData);
    fs.writeFileSync(historyCsvPath, newCsv, 'utf-8');

    console.log(`history.csv의 ${today} 날짜 기록이 업데이트되었습니다.`);
  } catch (error) {
    console.error('history.csv 업데이트 중 오류 발생:', error);
  }
}



function updateQuestion(title, type, isCorrect) {
  try {
    const csvPath = questionsCsvPath;

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
      return { success: false, message: 'CSV 파일을 찾을 수 없습니다.' };
    }

    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    const today = format(new Date(), 'yyyy-MM-dd');

    let updated = false;

    const updatedData = parsed.data.map((row) => {
      if (row.title === title && row.type === type) { // 제목과 유형으로 질문 식별
        let level = parseInt(row.level, 10);

        if (isCorrect) {
          level = Math.min(level + 1, 3); // 레벨 증가 (최대 3)
        } else {
          level = Math.max(level - 1, 0); // 레벨 감소 (최소 0)
        }

        // 레벨에 따른 날짜 계산
        let daysToAdd;
        switch (level) {
          case 0:
            daysToAdd = 1;
            break;
          case 1:
            daysToAdd = 2;
            break;
          case 2:
            daysToAdd = 3;
            break;
          case 3:
          default:
            daysToAdd = 4;
            break;
        }

        const newUpdateDate = format(addDays(new Date(), daysToAdd), 'yyyy-MM-dd');

        return {
          ...row,
          level: level.toString(),
          update: newUpdateDate,
          solveddate: today,
        };
      }
      return row;
    });

    // 변경 사항이 있는지 확인
    updated = parsed.data.some((row) => row.title === title && row.type === type);

    if (!updated) {
      return { success: false, message: '해당 질문을 찾을 수 없습니다.' };
    }

    // CSV 파일 업데이트
    const newCsv = Papa.unparse(updatedData);
    fs.writeFileSync(csvPath, newCsv, 'utf-8');

    // updateHistory(isCorrect);

    console.log(`질문 '${title}'이(가) 성공적으로 업데이트되었습니다.`);
    return { success: true, message: '질문이 성공적으로 업데이트되었습니다.' };
  } catch (error) {
    console.error('질문 업데이트 중 오류 발생:', error);
    return { success: false, message: '질문 업데이트에 실패했습니다.' };
  }
}

// 메인 프로세스에서 CSV 파일만 수정
ipcMain.handle('update-questions-file', async (event, questions) => {
  const csvPath = questionsCsvPath;
  const csvString = Papa.unparse(questions.map(question => {
    const { id, checked, ...rest } = question;
    return rest;
  })); // questions를 CSV 형식으로 변환
  fs.writeFileSync(csvPath, csvString, 'utf-8'); // CSV 파일 덮어쓰기

  return { success: true };
});

function createWindow() {
  // 먼저 recommenddate 업데이트 실행
  const updateResult = updateRecommendDates();
  if (!updateResult.success) {
    console.error(updateResult.message);
    // 필요에 따라 사용자에게 알림을 보내거나 애플리케이션을 종료할 수 있습니다.
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), 'preload.js'),
    },
  });

  // 빌드 후 index.html 파일 경로
  Menu.setApplicationMenu(Menu.buildFromTemplate([]));
  mainWindow.setMenu(null);

  // mainWindow.loadURL('http://localhost:3000'); // 개발 서버에서 실행 중인 React 앱 로드
  mainWindow.loadFile(path.join(__dirname, '../build', 'index.html'));


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

ipcMain.handle('update-question', async (event, { title, type, isCorrect }) => {
  return updateQuestion(title, type, isCorrect);
});

ipcMain.handle('update-history', async (event, { isCorrect }) => {
  try {
    updateHistory(isCorrect);
    return { success: true, message: 'history.csv가 성공적으로 업데이트되었습니다.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});


function readHistoryCSV() {
  try {
    const csvPath = historyCsvPath;

    if (!fs.existsSync(csvPath)) {
      console.error(`readHistoryCSV CSV 파일을 찾을 수 없습니다: ${csvPath}`);
      return { success: false, message: 'CSV 파일을 찾을 수 없습니다.' };
    }

    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    const historyData = parsed.data.map((row) => {
      const date = parseISO(row.date);
      if (!isValid(date)) return null;
      const solvedCount = Number(row.solvedCount);
      const correctCount = Number(row.correctCount);
      const correctRate = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
      return { date, solvedCount, correctCount, correctRate };
    }).filter(row => row !== null);

    return { success: true, historyData, message: 'history 읽기 성공' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'history 읽기 실패' };
  }
}


ipcMain.handle('save-image', async (event, { fileName, content }) => {
  try {
    const imageDir = path.join(exeDir, './images'); // 이미지 저장 디렉토리
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir); // 디렉토리가 없으면 생성
    }
    const filePath = path.join(imageDir, fileName); // 파일 경로 생성
    fs.writeFileSync(filePath, content); // 파일 저장

    // =================================================================================
    // 상대경로로
    return {
      success: true,
      path: "/images/" + fileName, // 경로
      filename: fileName // 파일 이름
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// .zip 내보내기
ipcMain.handle("export-questions", async (event, questions) => {
  const savePath = dialog.showSaveDialogSync(mainWindow, {
    title: "Export Questions as ZIP",
    defaultPath: "questions.zip",
    filters: [{ name: "ZIP Files", extensions: ["zip"] }],
  });

  if (!savePath) return { success: false, message: "No file selected" };

  try {
    // Create temp CSV file
    const tempDir = path.join(app.getPath("temp"), "questions_export");
    const csvPath = path.join(tempDir, "questions.csv");

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const csvContent = convertToCSV(questions);
    fs.writeFileSync(csvPath, csvContent, "utf-8");

    // Create ZIP file
    const output = fs.createWriteStream(savePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => console.log(`ZIP file created: ${savePath}`));
    archive.on("error", (err) => { throw err; });

    archive.pipe(output);
    archive.file(csvPath, { name: "questions.csv" });

    for (const question of questions) {
      if (question.img) {
        const imgPath = path.join(exeDir, question.img);
        console.log("Checking image:", imgPath, fs.existsSync(imgPath));

        if (fs.existsSync(imgPath)) {
          archive.file(imgPath, { name: `images/${path.basename(imgPath)}` });
        } else {
          console.warn(`Image not found: ${imgPath}`);
        }
      }
    }

    await archive.finalize();
    fs.rmSync(tempDir, { recursive: true, force: true }); // Clean up temp files

    return { success: true, path: savePath };
  } catch (error) {
    console.error("Error exporting questions:", error);
    return { success: false, message: error.message };
  }
});


function convertToCSV(questions) {
  const headers = Object.keys(questions[0]);
  const rows = questions.map((q) =>
    headers.map((header) => `"${q[header] || ""}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

//.zip 읽기
ipcMain.handle('extract-zip', async (event, { fileName, content }) => {
  const tempDir = path.join(os.tmpdir(), 'uploadedZip');
  let result;
  try {
    // 임시 디렉토리 생성
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // zip 파일 생성
    const zipFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(zipFilePath, content);

    // 압축 해제
    await extract(zipFilePath, { dir: tempDir });

    // 이미지 저장 디렉토리 생성
    const imageDir = path.join(exeDir, './images'); // 이미지 저장 디렉토리
    //    const imageDir = path.join(exeDir, 'images');

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    let csvFilePath = null;
    const questions = [];

    // 재귀적으로 디렉토리 탐색
    const traverseDirectory = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
          // 서브 디렉토리 탐색
          traverseDirectory(filePath);
        } else if (file.endsWith('.csv')) {
          // CSV 파일 발견
          csvFilePath = filePath;
        } else if (/\.(png|jpg|jpeg|gif)$/i.test(file)) {
          // 이미지 파일 발견
          const destPath = path.join(imageDir, file);
          fs.copyFileSync(filePath, destPath);
        }
      });
    };

    // 디렉토리 탐색
    traverseDirectory(tempDir);

    // CSV 파일 파싱
    if (csvFilePath) {
      const csvData = fs.readFileSync(csvFilePath, 'utf-8');
      const tagSet = new Set();
      const today = getTodayDate();

      // PapaParse로 CSV 파싱
      const { data } = Papa.parse(csvData, {
        header: true, // 첫 줄을 헤더로 사용
        skipEmptyLines: true, // 빈 줄 무시
      });

      // CSV 데이터를 questions 배열에 매핑
      data.forEach((item) => {
        const tags = item.tag
          ? item.tag.split(',').map((tag) => tag.trim())
          : [];
        tags.forEach((tag) => tagSet.add(tag));

        questions.push({
          title: item.title || '',
          type: item.type || '',
          select1: item.select1 || '',
          select2: item.select2 || '',
          select3: item.select3 || '',
          select4: item.select4 || '',
          answer: item.answer || '',
          img: item.img || '',
          level: 0,
          date: today,
          recommenddate: today,
          update: today,
          solveddate: null,
          tag: tags,
          id: generateUniqueId()
        });
      });
    } else {
      throw new Error('CSV 파일을 찾을 수 없습니다.');
    }

    // fs.rmSync(tempDir, { recursive: true, force: true });

    // 결과 반환
    result = { success: true, questions, csvFile: csvFilePath };

  } catch (error) {
    result = { success: false, error: error.message };
  } finally {
    if(fs.existsSync(tempDir)) {
      fs.rmSync(tempDir,{ recursive: true, force: true });
    }
  }
  return result;
});



ipcMain.handle('delete-image', async (event, { imgPath }) => {
  console.log("delete-image imgPath: ", imgPath);

  try {
    // exeDir와 images 폴더 그리고 imgPath를 결합하여 이미지 파일의 절대경로를 생성
    const imageFullPath = path.join(exeDir, imgPath);
    console.log("delete-image imageFullPath: ", imageFullPath);

    if (fs.existsSync(imageFullPath)) {
      fs.unlinkSync(imageFullPath); // 파일 삭제
      return { success: true, message: `Deleted: ${imageFullPath}` };
    } else {
      return { success: false, message: `File not found: ${imageDir}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// `readQuestionsCSV` 함수 호출 시 결과를 React로 보내는 IPC 핸들러 설정
ipcMain.handle('read-questions-csv', () => readQuestionsCSV());
ipcMain.handle('read-history-csv', () => readHistoryCSV());
ipcMain.handle("read-app-path", () => {
  return { appPath: exeDir };
});