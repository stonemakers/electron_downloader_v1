import api from '@/Api.js'

// 照片直播下载
// 通过照片直播，添加下载队列
export default async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 解析下载配置，获取下载资源
      const res = (await api.getCloudAlbumById(config.id)).data
      const dTask = JSON.parse(window.localStorage.getItem('dTask'))
      let title = res.name
      if (dTask) {
        dTask.map(item => {
          if (item.title === title) {
            title += '_1'
          }
        })
      }
      console.log(res, JSON.parse(res.templates))
      const watermark = JSON.parse(res.templates) ? JSON.parse(res.templates).waterStr ? JSON.parse(res.templates).waterStr.replace('R1000wWS', 'RtW') : '' : ''

      // 1. 获取直播照片列表
      const photoList = await getPhotoList(config.id)

      // 2. 获取分类列表
      const categoryList = await getCategoryList(config.id)

      // 3. 合成下载列表
      const fileList = combineDownloadList(config, title, photoList, categoryList, watermark)

      // 4. 返回任务
      resolve({
        type: config.downloadType,
        taskId: new Date().getTime() + parseInt(Math.random() * 1000),
        liveId: config.id,
        title: title,
        status: 0,
        fileList: fileList,
        finished: false
      })
    } catch (e) {
      reject(e)
    }
  })
}

const getPhotoList = async (liveId) => {
  let photoList = []
  // 获取原图库
  let arr = []
  const res = (await api.getCloudAlbumPhotoList({
    albumId: liveId,
    offset: 0,
    limit: 100
  })).data

  const count = Math.ceil(res.total / 100)

  for (let i = 0; i < count; i++) {
    const list = (await api.getCloudAlbumPhotoList({
      albumId: liveId,
      offset: i * 100,
      limit: 100
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
const combineDownloadList = (config, title, photoList, categoryList, watermark) => {
  let fileList = []
  if (photoList.length > 0) {
    photoList.map(item => {
      const categoryId = item.categoryId
      const categoryName = getCategoryNameById(categoryId, categoryList)
      fileList.push({
        id: item.id,
        url: config.sourceWatermark === 'true' ? item.url + '&' + watermark : item.url,
        savePath: `${fmtStr(title)}/${fmtStr(categoryName)}/${item.name}`,
        fold: `${fmtStr(title)}/${fmtStr(categoryName)}`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
    })
  } else {
    fileList.push({
      id: Math.random().toString(16),
      url: '',
      savePath: `${fmtStr(title)}`,
      fold: `${fmtStr(title)}`,
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