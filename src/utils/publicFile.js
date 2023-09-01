import api from '@/Api.js'

// 照片直播下载
// 通过照片直播，添加下载队列
export default async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 解析下载配置，获取下载资源
      const res = (await api.getAlbumById(config.id)).data
      const uId = res.userId
      const tId = res.teamId
      const dTask = JSON.parse(window.localStorage.getItem('dTask'))
      let title = res.name
      if (dTask) {
        dTask.map(item => {
          if (item.title === title) {
            title += '_1'
          }
        })
      }
      // 1. 获取资源列表
      const fileList = await getFileList(config.id, uId, tId)

      console.log('----fileList', fileList)

      // 3. 合成下载列表
      const fileLists = combineDownloadList(title, fileList)

      console.log('----fileLists', {
        type: config.downloadType,
        taskId: new Date().getTime() + parseInt(Math.random() * 1000),
        liveId: config.id,
        title: title,
        status: 0,
        fileList: fileLists,
        finished: false
      })

      // 4. 返回任务
      resolve({
        type: config.downloadType,
        taskId: new Date().getTime() + parseInt(Math.random() * 1000),
        liveId: config.id,
        title: title,
        status: 0,
        fileList: fileLists,
        finished: false
      })
    } catch (e) {
      reject(e)
    }
  })
}

const getFileList = async (liveId, uId, tId) => {
  let photoList = []
  // 获取原图库
  let arr = []
  const res = (await api.getPublicfile({
    sourceId: liveId,
    offset: 0,
    limit: 0,
    userId: uId,
    teamId: tId
  })).data

  console.log(res)

  const count = Math.ceil(res.total / 100)

  for (let i = 0; i < count; i++) {
    const list = (await api.getPublicfile({
      sourceId: liveId,
      offset: i * 100,
      limit: 100,
      userId: uId,
      teamId: tId
    })).data.result

    photoList.push(...list)
  }
  return photoList
}

// 获取分类列表
const getCategoryList = async (id) => {
  let categoryList
  categoryList = (await api.getCloudAlbumCategory(id)).data.result
  return categoryList
}

// 合成下载列表
const combineDownloadList = (title, photoList) => {
  let fileList = []
  if (photoList.length > 0) {
    photoList.map(item => {
      fileList.push({
        id: item.id,
        url: item.url,
        savePath: `${fmtStr(title)}/视频素材库/${item.name}`,
        fold: `${fmtStr(title)}/视频素材库`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
    })
  } else {
    fileList.push({
      id: Math.random().toString(16),
      url: '',
      savePath: `${fmtStr(title)}/视频素材库`,
      fold: `${fmtStr(title)}/视频素材库`,
      downloaded: false,
      status: 0 // 0:暂停下载 1: 待下载1
    })
  }

  return fileList
}

// 获取分类名称
const getCategoryNameById = (id, categoryList) => {
  if (id) {
    for (let i = 0; i < categoryList.length; i++) {
      if (categoryList[i].id === id) {
        return categoryList[i].name
      }
    }
  } else {
    return ''
  }
}

// 格式化路径
function fmtStr(text) {
  if (text) {
    return text.replace(/\//g, '').replace(/\\/g, '').replace(/\?/g, '').replace(/\n/g, ' ').replace(/\？/g, '').replace(/\*/g, '').replace(/\'/g, '').replace(/\"/g, '').replace(/\>/g, '').replace(/\</g, '').replace(/\|/g, '').replace(/\:/g, '').replace(/\｜/g, '').replace(/\：/g, '')
  } else {
    return ''
  }
}