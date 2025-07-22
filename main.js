const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "default",
    show: false,
  });

  mainWindow.loadFile("index.html");

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "All supported files",
        extensions: [
          "pdf",
          "docx",
          "xlsx",
          "pptx",
          "txt",
          "html",
          "csv",
          "json",
          "xml",
        ],
      },
      { name: "PDF files", extensions: ["pdf"] },
      { name: "Word documents", extensions: ["docx"] },
      { name: "Excel files", extensions: ["xlsx"] },
      { name: "PowerPoint files", extensions: ["pptx"] },
      { name: "Text files", extensions: ["txt"] },
      { name: "HTML files", extensions: ["html"] },
      { name: "CSV files", extensions: ["csv"] },
      { name: "JSON files", extensions: ["json"] },
      { name: "XML files", extensions: ["xml"] },
      { name: "All files", extensions: ["*"] },
    ],
  });

  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("select-output-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("convert-files", async (event, files, outputDir) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (files.length === 0) {
      resolve([]);
      return;
    }

    files.forEach((filePath, index) => {
      // Call Python converter script
      const python = spawn("python3", ["converter.py", filePath, outputDir]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        results[index] = {
          file: filePath,
          success: code === 0,
          message: code === 0 ? output.trim() : error.trim(),
        };

        completed++;

        // Send progress update
        event.sender.send("conversion-progress", {
          completed,
          total: files.length,
          current: path.basename(filePath),
        });

        if (completed === files.length) {
          resolve(results);
        }
      });
    });
  });
});

// Handle file drops
ipcMain.handle("validate-files", async (event, filePaths) => {
  const supportedExtensions = [
    ".pdf",
    ".docx",
    ".xlsx",
    ".pptx",
    ".txt",
    ".html",
    ".csv",
    ".json",
    ".xml",
  ];

  const validFiles = filePaths.filter((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return supportedExtensions.includes(ext);
  });

  return validFiles;
});
