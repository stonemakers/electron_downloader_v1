'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog, shell, Notification, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const path = require('path');
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import Store from 'electron-store'

// console.log(app.getPath('userData'))

const store = new Store({
  name: 'config', // 文件名称,默认 config
  fileExtension: 'json', // 文件后缀,默认json
  cwd: app.getPath('userData'), // 文件位置,尽量不要动
  //    encryptionKey:"aes-256-cbc" ,//对配置文件进行加密
  clearInvalidConfig: true // 发生 SyntaxError  则清空配置,
})

if(!store.get('downloadFold')){
  store.set('downloadFold',app.getPath('downloads'))
}



protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let win = ''

Menu.setApplicationMenu(null)

async function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 650,
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // nodeIntegration: true,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
    // win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// const gotTheLock = app.requestSingleInstanceLock()

// if (!gotTheLock) {
//   app.quit()
// } else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     // 当运行第二个实例时,将会聚焦到myWindow这个窗口
//     if (win) {
//       if (win.isMinimized()) win.restore()
//       win.focus()
//       // win.show()
//     }
//   })
// }

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      // await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      // console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  // 加载监听事件
  ipcMain.on('startDownload', (event, args) => {
    console.log('=======startDownload')
  })

  ipcMain.on('electron-store-get-data', (event, args) => {
    console.log('=======electron-store-get-data', args)
  })

  ipcMain.on('openDownloadFold', (event, args) => {
    try {
      console.log(args)
      shell.openPath(args)
    } catch (e) {
      dialog.showMessageBox({
        message: '资源不存在'
      })
    }
  })

  /**
   * ********************************
   * 系统通知
   * ********************************
   */
   ipcMain.on('notification', (event, arg) => {
    const title = arg.title
    const body = arg.body
    new Notification({ title: title, body: body }).show()
  })

   /**
   * ********************************
   * 设置角标
   * ********************************
   */
    ipcMain.on('setBadge', (event, arg) => {
      if (process.platform === 'darwin') {
        if (arg === 0) {
          app.dock.setBadge('')
        } else {
          app.dock.setBadge(arg.toString())
        }
      }
    })

  ipcMain.on('choosePath', async (event, args) => {
    dialog
      .showOpenDialog({ title: '选择下载目录', properties: ['openDirectory', 'createDirectory'] })
      .then(result => {
        if (result.canceled === false) {
          const downloadsFolder = result.filePaths[0]
          console.log('=====downloadFold', downloadsFolder)
          // 将该文件路径返回给渲染进程
          store.set('downloadsFolder', downloadsFolder)
          if (win && win.webContents) {
           win.webContents.send('setDownloadFolder', downloadsFolder)
          }
        }
      })
      .catch(err => {
        console.log(err)
      })
  })
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// 设置下载器监听协议名称
// app.setAsDefaultProtocolClient('yaopai')

// 监听下载器下载任务ID Mac端平台
// app.on('open-url', (event, url) => {
//   // event.preventDefault()
//   // 示例下载任务url yaopai://liveId=1891XW9W2R00&type=publish&category=publish&watermark=false
//   console.log('====发送initConfig')
//   win.webContents.send('initConfig', decodeURI(url).split('://')[1])
// })



// ================================================
// ================================================
// ================================================
// ================================================
// ================================================
// 处理打开协议


const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

const PROTOCOL = 'yaopai';
const args = [];
if (!app.isPackaged) {
  args.push(path.resolve(process.argv[1]));
}
args.push('--');

app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args);

handleArgv(process.argv);

app.on('second-instance', (event, argv) => {
  if (process.platform === 'win32') {
    // Windows
    handleArgv(argv);
  }
});

// macOS
app.on('open-url', (event, urlStr) => {
  event.preventDefault()
  handleUrl(urlStr);
});

function handleArgv(argv) {
  const prefix = `${PROTOCOL}:`;
  const offset = app.isPackaged ? 1 : 2;
  const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
  if (url) handleUrl(url);
}

function handleUrl(urlStr) {
  // myapp://?name=1&pwd=2
  const urlObj = new URL(urlStr);
  const { searchParams } = urlObj;
  console.log(urlObj.search.replace('?','')); // -> ?name=1&pwd=2
  // ================================================
  if(win && win.webContents){
    win.focus()
    win.webContents.send('initConfig', urlObj.search.replace('?',''))
  }else{
    // alert('haha')
  }
}
