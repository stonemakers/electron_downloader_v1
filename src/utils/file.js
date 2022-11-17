import Store from 'electron-store'

export default (config) => {
  return {
    type: config.downloadType,
    taskId: new Date().getTime()+ parseInt(Math.random()*1000),
    title: config.name,
    status: 0,
    fileList: [{
      url: config.url,
      savePath: `${config.name}`,
      fold: ``,
      downloaded: false,
      finished: false,
      status: 0 // 0:暂停下载 1: 待下载
    }]
  }
}