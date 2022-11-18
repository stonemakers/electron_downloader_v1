'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog, shell, Notification, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const path = require('path');
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

const menu = Menu.buildFromTemplate(appMenu);
Menu.setApplicationMenu(menu);


let curl = ''

const store = new Store({
  name: 'config', // 文件名称,默认 config
  fileExtension: 'json', // 文件后缀,默认json
  cwd: app.getPath('userData'), // 文件位置,尽量不要动
  //    encryptionKey:"aes-256-cbc" ,//对配置文件进行加密
  clearInvalidConfig: true // 发生 SyntaxError  则清空配置,
})

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

// Menu.setApplicationMenu(null)

async function createWindow () {
  win = new BrowserWindow({
    width: 380,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // nodeIntegration: true,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  // win.webContents.openDevTools()

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

// win.on("close", (event) => {
//   event.preventDefault();//阻止默认关闭事件
//   win.hide(); //隐藏窗口
// });

// win.on("closed", () => {
//   win= null;//移除相应窗口的引用对象，避免再次使用它.
// });


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function handleUrl (urlStr) {
  // myapp://?name=1&pwd=2
  console.log(urlStr)
  // win.webContents.send('console', '进入handleUrl')
  // const urlObj = new URL(urlStr);
  // const { searchParams } = urlObj;
  // console.log(urlObj.search.replace('?','')); // -> ?name=1&pwd=2
  // ================================================
  curl = urlStr


  let timmer = setInterval(() => {
    try{
      if(win && win.webContents){
        win.focus()
        setTimeout(() => {
          if(win && win.webContents){
            // win.webContents.send('console', '有win')
            win.webContents.send('initConfig', curl)
            // win.webContents.send('console', '发送了initConfig')
          }else{
            // win.webContents.send('console', '没有win')
            if(timmer){
              clearInterval(timmer)
            }   
          }
        }, 1000);
        if(timmer){
          clearInterval(timmer)
        }
        // win.webContents.send('console', '22222')
      }
    }catch(e){
      if(timmer){
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

  

  // win.on('close', (e, d) => {
  //   e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
  //   dialog.showMessageBox({
  //     type: 'info',
  //     title: '提示',
  //     message: '下载任务将清空，确认退出？',
  //     buttons: ['确认', '取消'],   //选择按钮，点击确认则下面的idx为0，取消为1
  //     cancelId: 1, //这个的值是如果直接把提示框×掉返回的值，这里设置成和“取消”按钮一样的值，下面的idx也会是1
  //   }).then(idx => {
  //     //注意上面↑是用的then，网上好多是直接把方法做为showMessageBox的第二个参数，我的测试下不成功
  //     console.log(idx)
  //     if (idx.response == 1) {
  //       console.log('index==1，取消关闭')
  //       e.preventDefault();
  //     } else {
  //       console.log('index==0，关闭')
  //       win = null
  //       app.exit();
  //     }
  //   })
  // })


  let dTask = ''
  // 创建下载任务进程
  ipcMain.on('startDownloadTask', (event, args) => {

    downloadWin = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      // resizable: false,
      webPreferences: {
        nodeIntegration: true,
        // nodeIntegration: true,
        contextIsolation: false
      }
    })
    downloadWin.webContents.openDevTools()
    dTask = args.message
    downloadWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/download')
    // downloadWin.webContents.send('downloadStart', args.message)


    // 下载加载成功
    ipcMain.on('download-process-ready', (event, arg) => {
      downloadWin.webContents.send('downloadStart', dTask)
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
    if(nwin){
      nwin.webContents.send('loadFinished', taskStr)
    }
  }) 

  // 窗口加载状态通知
  ipcMain.on('loadingTask', (event, arg) => {
    win.webContents.send('loadingTask', arg)
  })

  // 窗口加载状态通知
  ipcMain.on('pushTask', (event, arg) => {
    win.webContents.send('pushTask', arg)
    // nwin.destroy()
  })

  ipcMain.on('destroy', (event, arg) => {
    // win.webContents.send('pushTask', arg)
    if(nwin){
      nwin.destroy()
      nwin = null
    }
  })

  ipcMain.on('alert', (event, arg) => {
    win.webContents.send('alert', arg)
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

  function handleArgv (argv) {
    const prefix = `${PROTOCOL}:`;
    const offset = app.isPackaged ? 1 : 2;
    const url = argv.find((arg, i) => i >= offset && arg.startsWith(prefix));
    if (url) handleUrl(url);
  }
})

// app.on('open-url', (event, urlStr) => {
//   console.log('监听到open-url1')
//   win.webContents.send('console', '监听到open-url:'+urlStr)
//   event.preventDefault()
//   handleUrl(urlStr);
// });

app.on ('will-finish-launching' , () => {
  console.log('*****%%%%$$$$')
  // handleUrl('yaopai://download?liveId=1891XW9W2R00&type=publish&category=publish&watermark=true');
  // dialog.showMessageBox(win, {message: 'hahahahah'})
  // win.webContents.send('demo', '哈哈哈哈哈哈')
  // handleUrl(urlStr);
  try{
  app.on('open-url', (event, urlStr) => {
    // win.webContents.send('demo', urlStr)
    console.log('监听到open-url1')
    event.preventDefault()
    handleUrl(urlStr);
    // dialog.showMessageBox(win, {message: urlStr})
  });
}catch(e){
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
