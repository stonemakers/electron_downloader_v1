import api from '@/Api.js'
import { ipcRenderer } from 'electron'

// 照片直播下载
// 通过照片直播，添加下载队列
export default async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 解析下载配置，获取下载资源
      const res = (await api.getAlbumById(config.id)).data

      let dTask = JSON.parse(window.localStorage.getItem('dTask'))
      let title = res.name
      // if (dTask) {
      //   dTask.map(item => {
      //     if (item.title === title) {
      //       title += '_1'

      //     }
      //   })
      // }
      const info = JSON.parse(res.templates)
      const waterStr = info ? info.waterStr : ''

      // const watermark 333= JSON.parse(res.templates) ? JSON.parse(res.templates).waterStr.replace('R1000wWS', 'RtW') : ''
      const watermark = waterStr ? waterStr.replaceAll('imageMogr2/auto-orient|', '')
        .replaceAll('/thumbnail/800x', '')
        .replaceAll('imageMogr2|', '')
        .replaceAll('|imageslim', '') : ''
      // 1. 获取直播照片列表
      const photoList = await getPhotoList(config.id, config.source, config.sourceType, config.sourceId)
      // console.log('====photoList', photoList)
      // 2. 获取分类列表
      console.log('-----config', config)
      const categoryList = await getCategoryList(config.id, config.sourceType)
      // console.log('categoryList', categoryList)
      // 3. 合成下载列表
      const fileList = await combineDownloadList(config, title, photoList, categoryList, watermark)

      console.log('fileList', fileList)

      // 4. 返回任务
      resolve({
        type: config.downloadType,
        taskId: Math.random().toString(16),
        liveId: config.id,
        title: `${title}`,
        status: 0,
        fileList: fileList,
        finished: false,
        desc: {
          source: config.source,
          sourceType: config.sourceType,
          sourceWatermark: config.sourceWatermark,
          sourceName: await getSourceName(config, categoryList)
        }
      })
    } catch (e) {
      reject(e)
    }

  })
}

const getPhotoList = async (liveId, downloadType, sourceType, sourceId = null) => {

  console.log('---sourceId1', sourceId, sourceType)

  let photoList = []
  if (downloadType === 'origin') {
    // 获取原图库
    let arr = []
    let params = {}

    if (sourceType === 'origin') {
      params = {
        categoryId: sourceId,
      }
    }
    if (sourceType === 'photographer') {
      params = {
        createdUserId: sourceId,
      }
    }

    //1
    // console.log()
    try {
      const res = (await api.getOriginAlbumPhotoList({
        albumId: liveId,
        limit: 0,
        ...params
      })).data

      const count = Math.ceil(res.total / 100)

      for (let i = 0; i < count; i++) {
        const list = (await api.getOriginAlbumPhotoList({
          albumId: liveId,
          offset: i * 100,
          limit: 100,
          ...params
        })).data.result

        photoList.push(...list)
      }
    } catch (e) {
      ipcRenderer.send('alert', '该活动未添加你为协作者，无法获取到原图库列表')
      // alert('该活动未添加你为协作者，无法获取到原图库列表')
      throw '该活动未添加你为协作者，无法获取到原图库列表'
    }
  } else {
    // 获取发布照片库
    let arr = []
    let params = {}

    if (sourceType === 'publish') {
      params = {
        categoryId: sourceId,
      }
    }
    if (sourceType === 'origin') {
      params = {
        originalCategoryId: sourceId,
      }
    }
    if (sourceType === 'photographer') {
      params = {
        originalUserId: sourceId,
      }
    }
    if (sourceType === 'retoucher') {
      params = {
        createdUserId: sourceId,
      }
    }

    const res = (await api.getPublishAlbumPhotoList({
      albumId: liveId,
      limit: 0,
      ...params
    })).data

    const count = Math.ceil(res.total / 100)

    for (let i = 0; i < count; i++) {
      const list = (await api.getPublishAlbumPhotoList({
        albumId: liveId,
        offset: i * 100,
        limit: 100,
        ...params
      })).data.result

      photoList.push(...list)
    }
  }
  return photoList
}

const getSourceName = async (config, categoryList) => {
  console.log(1)
  if (config.sourceId) {
    console.log(2)
    let name = await getName(config.sourceType, config.sourceId, categoryList)
    return name
  } else {
    console.log(3)
    if (config.source === 'publish') {
      console.log(4)
      return '全部分类'
    }
    if (config.source === 'origin') {
      console.log(5)
      return '全部标签'
    }
    if (config.source === 'photographer') {
      console.log(6)
      return '全部摄影师'
    }
    if (config.source === 'retoucher') {
      console.log(7)
      return '全部修图师'
    }
  }
}

// 获取分类列表
const getCategoryList = async (id, arg) => {
  // console.log('<<<<', id, arg)
  try {
    let categoryList
    if (arg === 'origin') {
      categoryList = (await api.getOriginCategory(id)).data.result
    }
    if (arg === 'publish') {
      categoryList = (await api.getPublishCategory(id)).data.result
    }
    if (arg === 'photographer') {
      let res = (await api.getWorkers(id)).data.result
      // console.log('=====', res)
      let pList = []
      res.forEach(item => {
        if (item.role === 'Photographer') {
          pList.push(item)
        }
      })
      categoryList = pList
    }
    if (arg === 'retoucher') {
      let res = (await api.getWorkers(id)).data.result
      let rList = []
      res.forEach(item => {
        if (item.role === 'Retoucher') {
          rList.push(item)
        }
      })
      categoryList = rList
    }
    return categoryList
  } catch (e) {
    console.error(e)
    alert('该活动未添加你为协作者，无法获取到原图库分类')
    throw '该活动未添加你为协作者，无法获取到原图库分类'
  }
}

const getName = async (type, id, list) => {
  console.log('========666', type, id, list)
  if (id) {
    if (type === 'publish') {
      return getCategoryNameById(id, list) || '未分类'
    }
    if (type === 'origin') {
      return getCategoryNameById(id, list) || '无标签'
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
const getTName = (type) => {
  if (type === 'publish') {
    return '发布照片'
  }
  if (type === 'origin') {
    return '原片'
  }
}

const getTName2 = (type) => {
  if (type === 'publish') {
    return '按分类'
  }
  if (type === 'origin') {
    return '按标签'
  }
  if (type === 'photographer') {
    return '按摄影师'
  }
  if (type === 'retoucher') {
    return '按修图师'
  }
}

// 合成下载列表
const combineDownloadList = async (config, title, photoList, categoryList, watermark) => {
  let fileList = []
  if (photoList.length > 0) {
    for (let i = 0; i < photoList.length; i++) {
      console.log('???', photoList[i].categoryId)
      let categoryName = ''
      if (config.source === 'publish') {
        if (config.sourceType === 'publish') {
          categoryName = await getName(config.sourceType, photoList[i].categoryId, categoryList)
        }
        if (config.sourceType === 'origin') {
          categoryName = await getName(config.sourceType, photoList[i].originalCategoryId, categoryList)
        }
        if (config.sourceType === 'photographer') {
          categoryName = await getName(config.sourceType, photoList[i].originalUserId, categoryList)
        }
        if (config.sourceType === 'retoucher') {
          categoryName = await getName(config.sourceType, photoList[i].createdUserId, categoryList)
        }
      } else {
        if (config.sourceType === 'origin') {
          categoryName = await getName(config.sourceType, photoList[i].categoryId, categoryList)
        }
        if (config.sourceType === 'photographer') {
          categoryName = await getName(config.sourceType, photoList[i].createdUserId, categoryList)
        }
      }

      console.log('categoryName', categoryName)
      fileList.push({
        id: photoList[i].id,
        url: config.sourceWatermark ? photoList[i].url + '&' + watermark : photoList[i].url,
        savePath: `${fmtStr(title)}/${getTName(config.source)}${config.source === 'publish' ? config.sourceWatermark ? '_有水印' : '_无水印' : ''}/${getTName2(config.sourceType)}/${fmtStr(categoryName)}/${photoList[i].name}`,
        fold: `${fmtStr(title)}/${getTName(config.source)}${config.source === 'publish' ? config.sourceWatermark ? '_有水印' : '_无水印' : ''}/${getTName2(config.sourceType)}/${fmtStr(categoryName)}`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
    }
  } else {
    let categoryName = await getName(config.sourceType, config.sourceId, categoryList)

    fileList.push({
      id: Math.random().toString(16),
      url: '',
      savePath: `${fmtStr(title)}/${getTName(config.source)}${config.source === 'publish' ? config.sourceWatermark ? '_有水印' : '_无水印' : ''}/${getTName2(config.sourceType)}/${fmtStr(categoryName)}`,
      fold: `${fmtStr(title)}/${getTName(config.source)}${config.source === 'publish' ? config.sourceWatermark ? '_有水印' : '_无水印' : ''}/${getTName2(config.sourceType)}/${fmtStr(categoryName)}`,
      downloaded: false,
      status: 0 // 0:暂停下载 1: 待下载
    })
  }
  return fileList
}

// 获取分类名称
const getCategoryNameById = (id, categoryList) => {
  // console.log('******', id, categoryList)
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
    return text.replace(/\//g, '').replace(/\\/g, '').replace(/\n/g, ' ').replace(/\?/g, '').replace(/\？/g, '').replace(/\*/g, '').replace(/\'/g, '').replace(/\"/g, '').replace(/\>/g, '').replace(/\</g, '').replace(/\|/g, '').replace(/\:/g, '').replace(/\｜/g, '').replace(/\：/g, '')
  }
}