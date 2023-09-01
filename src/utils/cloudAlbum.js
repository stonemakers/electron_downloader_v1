import api from '@/Api.js'

// 照片直播下载
// 通过照片直播，添加下载队列
export default async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 解析下载配置，获取下载资源
      config.sourceType = config.source ? config.source : 'publish'
      config.sourceType = config.sourceType ? config.sourceType : 'publish'
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
      const watermark = JSON.parse(res.templates) ? JSON.parse(res.templates).waterStr ? JSON.parse(res.templates).waterStr.replaceAll('imageMogr2/auto-orient|', '')
        .replaceAll('/thumbnail/800x', '')
        .replaceAll('imageMogr2|', '')
        .replaceAll('|imageslim', '') : '' : ''
      console.log('----watermark: ', watermark)
      // 1. 获取直播照片列表
      const photoList = await getPhotoList(config.id, config.source, config.sourceType, config.sourceId)

      // 2. 获取分类列表
      const categoryList = await getCategoryList(config.id, config.sourceType)
      console.log('categoryList', categoryList)

      // 3. 合成下载列表
      const fileList = await combineDownloadList(config, title, photoList, categoryList, watermark)
      console.log('===6', fileList)

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

const getPhotoList = async (liveId, downloadType, sourceType, sourceId = null) => {
  console.log('---sourceType', sourceType)
  console.log('---sourceId', sourceId)

  let photoList = []
  // 获取原图库
  let arr = []
  let params = {}

  if (sourceType === 'publish') {
    params = {
      categoryId: sourceId,
    }
  }
  if (sourceType === 'retoucher') {
    params = {
      createdUserId: sourceId,
    }
  }

  const res = (await api.getCloudAlbumPhotoList({
    albumId: liveId,
    limit: 0,
    ...params
  })).data

  const count = Math.ceil(res.total / 100)

  for (let i = 0; i < count; i++) {
    const list = (await api.getCloudAlbumPhotoList({
      albumId: liveId,
      offset: i * 100,
      limit: 100,
      ...params
    })).data.result

    photoList.push(...list)
  }
  return photoList
}

// 获取分类列表
const getCategoryList = async (id, arg) => {
  console.log('<<<<', id, arg)
  let categoryList
  if (arg === 'retoucher') {
    let res = (await api.getWorkers(id)).data.result
    let rList = []
    res.forEach(item => {
      if (item.role === 'Retoucher') {
        rList.push(item)
      }
    })
    categoryList = rList
  } else {
    categoryList = (await api.getCloudAlbumCategory(id)).data.result
  }
  return categoryList
}

const getName = async (type, id, list) => {
  if (id) {
    if (type === 'publish') {
      return getCategoryNameById(id, list) || '默认分类'
    }
    if (type === 'origin') {
      return getCategoryNameById(id, list) || '默认分类'
    }
    if (type === 'photographer') {
      // 遍历list中对象的id属性，如果存在则返回name
      const list1 = list.map(item => item.id)
      if (list1.includes(id)) {
        const res = await api.getCreateUserName(id)
        if (res && res.data) {
          return res.data.nickname
        } else {
          return '未命名'
        }
      } else {
        return '未命名'
      }
    }
    if (type === 'retoucher') {
      const list1 = list.map(item => item.id)
      if (list1.includes(id)) {
        const res = await api.getCreateUserName(id)
        if (res && res.data) {
          return res.data.nickname
        } else {
          return '未命名'
        }
      } else {
        return '未命名'
      }
    }
  } else {
    return '未命名'
  }
}

// 合成下载列表
const combineDownloadList = async (config, title, photoList, categoryList, watermark) => {
  let fileList = []
  console.log('===1')
  if (photoList.length > 0) {
    console.log('===2', photoList)
    for (let i = 0; i < photoList.length; i++) {
      let categoryName = ''
      if (config.sourceType === 'publish') {
        categoryName = await getName(config.sourceType, photoList[i].categoryId, categoryList)

      }
      if (config.sourceType === 'retoucher') {
        categoryName = await getName(config.sourceType, photoList[i].createdUserId, categoryList)
      }

      console.log('===3', categoryName)
      fileList.push({
        id: photoList[i].id,
        url: config.sourceWatermark === 'true' ? photoList[i].url + '&' + watermark : photoList[i].url,
        savePath: `${fmtStr(title)}/${fmtStr(categoryName)}/${photoList[i].name}`,
        fold: `${fmtStr(title)}/${fmtStr(categoryName)}`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
      console.log('===4', fileList)
    }
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
  console.log('===9')
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