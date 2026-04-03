import { app, BrowserWindow, Event, Input, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Path to store window state
const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

// Helper: Load window state
const loadWindowState = () => {
    try {
        if (fs.existsSync(windowStatePath)) {
            const data = fs.readFileSync(windowStatePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        // ignore error
    }
    // Default size (approx 80% of 1200x800)
    return { width: 1350, height: 900 };
};

// Helper: Save window state
const saveWindowState = () => {
    if (!mainWindow) return;
    try {
        const bounds = mainWindow.getBounds();
        fs.writeFileSync(windowStatePath, JSON.stringify(bounds));
    } catch (e) {
        // ignore error
    }
};

const createSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    if (app.isPackaged) {
        splashWindow.loadFile(path.join(__dirname, '../dist/splash.html'));
    } else {
        splashWindow.loadFile(path.join(__dirname, '../public/splash.html'));
    }

    splashWindow.center();
};

const createMainWindow = () => {
    const windowState = loadWindowState();
    const preloadPath = path.join(__dirname, 'preload.js');

    mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: 800,
        minHeight: 600,
        show: false, // Hidden initially
        frame: false, // Frameless window for custom title bar
        autoHideMenuBar: true, // Hide menu bar
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath
        }
    });

    // Handle external links (e.g., download updates) to open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    if (app.isPackaged) {
        mainWindow.webContents.on('before-input-event', (event: Event, input: Input) => {
            if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
                event.preventDefault();
            }
        });
        mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
    }

    mainWindow.on('close', () => {
        saveWindowState();
    });

    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        }, 500);
    });
};

// IPC Listeners for Window Controls
ipcMain.on('window-control', (event, action) => {
    if (!mainWindow) return;
    switch (action) {
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
            break;
        case 'close':
            mainWindow.close();
            break;
    }
});

// NEW: IPC Handler to get App Version
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

app.whenReady().then(() => {
    createSplashWindow();
    createMainWindow();

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