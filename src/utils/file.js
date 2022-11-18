export default (config) => {
  return {
    type: config.downloadType,
    taskId: Math.random().toString(16),
    title: config.name,
    status: 0,
    finished: false,
    fileList: [{
      url: config.url,
      savePath: `${config.name}`,
      fold: ``,
      downloaded: false,
      status: 0 // 0:暂停下载 1: 待下载
    }]
  }
}