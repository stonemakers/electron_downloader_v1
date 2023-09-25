'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen, dialog, shell, Notification, Menu, session } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const isDevelopment = process.env.NODE_ENV !== 'production'
import Store from 'electron-store'

const appMenu = [
  {
    label: '编辑',
    submenu: [
      { label: '剪切', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: '复制', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: '粘贴', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: '全选', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  }
];

let winList = []

const menu = Menu.buildFromTemplate(appMenu);
Menu.setApplicationMenu(menu);

let curl = ''


console.log('文件存储位置：', app.getPath('userData'))

let store = ''

store = new Store({
  name: 'config', // 文件名称,默认 config
  fileExtension: 'json', // 文件后缀,默认json
  cwd: app.getPath('userData'), // 文件位置,尽量不要动
  //    encryptionKey:"aes-256-cbc" ,//对配置文件进行加密
  clearInvalidConfig: true // 发生 SyntaxError  则清空配置,
})

console.log('download目录：', store.get('downloadFold'))
if (!store.get('downloadFold')) {
  store.set('downloadFold', app.getPath('downloads'))
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let win = ''
let nwin = ''
let taskStr = ''
let downloadWin = ''
let bar = ''

async function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // nodeIntegration: true,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  winList.push(win)
  // win.webContents.openDevTools()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
    if (win) {
      win.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  win.on('close', () => {
    console.log('yao guanbi le ')
    const allWindows = BrowserWindow.getAllWindows();

    allWindows.forEach(win => {
      if (!win.isDestroyed()) {
        win.close();
      }
    });

    winList.forEach(item => {
      if (item && !win.isDestroyed()) {
        item.close()
      }
    })
  })
}



app.commandLine.appendSwitch("--disable-http-cache");

app.on('window-all-closed', () => {
  console.log('window-all-closed')
  app.quit()
})



app.on('before-quit', () => {
  console.log('<<<<<before-quit')
  const allWindows = BrowserWindow.getAllWindows();

  allWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });

  winList.forEach(item => {
    if (item && !win.isDestroyed()) {
      item.close()
    }
  })
});

app.on('closed', () => {
  console.log('---0')
  const allWindows = BrowserWindow.getAllWindows();

  allWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });

  winList.forEach(item => {
    if (item && !win.isDestroyed()) {
      item.close()
    }
  })

  app.quit()
  console.log('---1')
  process.exit(0)
})



app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function handleUrl(urlStr) {
  curl = urlStr
  let timmer = setInterval(() => {
    try {
      if (win && win.webContents) {
        win.focus()
        setTimeout(() => {
          if (win && win.webContents) {
            win.webContents.send('initConfig', curl)
          } else {
            if (timmer) {
              clearInterval(timmer)
            }
          }
        }, 1000);
        if (timmer) {
          clearInterval(timmer)
        }
      }
    } catch (e) {
      if (timmer) {
        clearInterval(timmer)
      }
    }
  }, 500)
}

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      // await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      // console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  // createBar()
  // 加载监听事件
  ipcMain.on('startDownload', (event, args) => {
    console.log('=======startDownload')
  })

  ipcMain.on('electron-store-get-data', (event, args) => {
    console.log('=======electron-store-get-data', args)
  })

  ipcMain.on('openDownloadFold', (event, args) => {
    try {
      let escapedPath = args.replace(/\n/g, '\\n');
      // console.log(escapedPath)
      shell.openPath(escapedPath);
    } catch (e) {
      dialog.showMessageBox({
        message: '资源不存在'
      })
    }
  })

  let dTask = ''
  // 创建下载任务进程
  ipcMain.on('startDownloadTask', (event, args) => {

    downloadWin = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        // nodeIntegration: true,
        contextIsolation: false
      }
    })
    winList.push(downloadWin)
    downloadWin.webContents.openDevTools()
    dTask = args.message
    downloadWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/download')
    // downloadWin.webContents.send('downloadStart', args.message)

    downloadWin.on('close', () => {
      downloadWin = null
    })

    // 下载加载成功
    ipcMain.on('download-process-ready', (event, arg) => {
      if (downloadWin) {
        downloadWin.webContents.send('downloadStart', dTask)
      }
    })
  })

  // 创建新窗口
  ipcMain.on('createNewWindow', async (event, args) => {
    nwin = new BrowserWindow({
      width: 600,
      height: 600,
      show: false,
      // resizable: false,
      webPreferences: {
        nodeIntegration: true,
        // nodeIntegration: true,
        contextIsolation: false
      }
    })

    winList.push(nwin)

    nwin.on('close', () => {
      nwin = null
    })

    taskStr = args.message
    // nwin.webContents.openDevTools()
    console.log('=====taskStr', taskStr)

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      await nwin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/task')
      if (!process.env.IS_TEST) nwin.webContents.openDevTools()
      // win.webContents.openDevTools()
    } else {
      createProtocol('app')
      nwin.loadURL('app://./index.html#task')
    }
  })

  // 窗口加载成功
  ipcMain.on('window-load-success', (event, arg) => {
    if (nwin) {
      nwin.webContents.send('loadFinished', taskStr)
    }
  })


  // 窗口加载成功
  ipcMain.on('clearData', (event, arg) => {
    if (win) {
      console.log('clear1')
      const ses = win.webContents.session
      ses.clearStorageData({
        storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
      })
    }
    console.log('clear2')
    store.clear()
  })


  // 窗口加载状态通知
  ipcMain.on('loadingTask', (event, arg) => {
    if (win) {
      win.webContents.send('loadingTask', arg)
    }
  })

  // 窗口加载状态通知
  ipcMain.on('pushTask', (event, arg) => {
    console.log('====jianting pushTask')
    if (win) {
      win.webContents.send('pushTask', arg)
    }
    // nwin.destroy()

    // setTimeout(() => {
    //   if (nwin) {
    //     nwin.destroy()
    //     nwin = null
    //   }
    // }, 2000);
  })

  ipcMain.on('destroy', (event, arg) => {
    // win.webContents.send('pushTask', arg)
    if (nwin) {
      nwin.destroy()
      nwin = null
    }
  })

  ipcMain.on('alert', (event, arg) => {
    if (win) {
      win.webContents.send('alert', arg)
    }
  })

  ipcMain.on('update', (event, v) => {
    // 唤起系统默认的浏览器打开指定的网址
    shell.openExternal(`https://assets.aiyaopai.com/pan/LightIO-${v}.${process.platform !== 'darwin' ? 'exe' : 'dmg'}`);
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

  // 处理打开协议

  console.log('======process.argv', process.argv)

  // dialog.showMessageBox(win, {message: process.argv[0]})

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

  function handleArgv(argv) {
    const prefix = `${PROTOCOL}:`;
    const offset = app.isPackaged ? 1 : 2;
    const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
    if (url) handleUrl(url);
  }
})

process.on('uncaughtException', function (error) {
  // log the error or take other actions
  // 不要执行默认的错误处理，因此不会有错误弹窗出现
  console.log('--error', error)
});

// app.on('open-url', (event, urlStr) => {
//   console.log('监听到open-url1')
//   win.webContents.send('console', '监听到open-url:'+urlStr)
//   event.preventDefault()
//   handleUrl(urlStr);
// });

app.on('will-finish-launching', () => {
  console.log('*****%%%%$$$$')
  // handleUrl('yaopai://download?liveId=1891XW9W2R00&type=publish&category=publish&watermark=true');
  // dialog.showMessageBox(win, {message: 'hahahahah'})
  // win.webContents.send('demo', '哈哈哈哈哈哈')
  // handleUrl(urlStr);
  try {
    app.on('open-url', (event, urlStr) => {
      // win.webContents.send('demo', urlStr)
      console.log('监听到open-url1', urlStr)
      event.preventDefault()
      handleUrl(urlStr);
      // dialog.showMessageBox(win, {message: urlStr})
    });
  } catch (e) {
    console.log(e)
  }
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
