const {app, BrowserWindow, Menu} = require('electron')
const url = require("url");
const path = require('node:path')



const createWindow = (width = 1000, height = 700) => {
    const win = new BrowserWindow({
        width: width,
        height: height,
        
    })
    win.setMinimumSize(890, 500);

    Menu.setApplicationMenu(null);

    win.loadURL(
        url.format({
            pathname: path.join(__dirname, `/dist/chord-app/browser/index.html`),
            protocol: "file:",
            slashes: true
        })
    );
}

app.whenReady().then(() => {
    createWindow()
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})
