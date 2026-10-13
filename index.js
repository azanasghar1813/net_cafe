const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let splashWindow;

// We need to set the DB path to the user's AppData directory in production
// so the SQLite file can be written to.
const dbPath = path.join(app.getPath('userData'), 'netcafe.sqlite');
process.env.DB_PATH = dbPath;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile('splash.html');
  splashWindow.center();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Remove the default Electron menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  // In production, we load the built Vite frontend.
  // In development, we load localhost:5173 (if running npm run dev)
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  try {
    require(path.join(__dirname, 'backend', 'server.js'));
    console.log("Backend started successfully.");
  } catch (err) {
    console.error("Failed to start backend:", err);
  }
}

function waitForBackend(url, cb) {
  const check = () => {
    http.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 401) {
        cb();
      } else {
        setTimeout(check, 500);
      }
    }).on('error', () => {
      setTimeout(check, 500);
    });
  };
  check();
}

app.whenReady().then(() => {
  createSplashWindow();
  
  // Start backend silently
  startBackend();

  // Wait for the backend to be responsive on port 5000 before loading frontend
  waitForBackend('http://localhost:5000/api/dashboard', () => {
    // Backend is ready, now load the Main Window
    // Give it a tiny visual delay so the splash screen feels satisfying
    setTimeout(createMainWindow, 1000);
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// No need to kill a child process since it's running in the same Node process
