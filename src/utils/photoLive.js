import api from '@/Api.js'
import { ipcRenderer } from 'electron'

// 照片直播下载
// 通过照片直播，添加下载队列
export default async (config) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 解析下载配置，获取下载资源
      const res = (await api.getAlbumById(config.id)).data
      console.log('&&&&&&&&&dTask:', window.localStorage.getItem('dTask'))
      let dTask = JSON.parse(window.localStorage.getItem('dTask'))
      console.log('1111', dTask)
      let title = res.name
      if (dTask) {
        dTask.map(item => {
          if (item.title === title) {
            title += '_1'
          }
        })
      }
      const info = JSON.parse(res.templates)
      const waterStr = info ? info.waterStr : ''
      console.log('info', info)
      // const watermark = JSON.parse(res.templates) ? JSON.parse(res.templates).waterStr.replace('R1000wWS', 'RtW') : ''
      const watermark = waterStr ? waterStr.replace('R1000wWS', 'RtW') : ''
      // 1. 获取直播照片列表
      const photoList = await getPhotoList(config.id, config.source)
      console.log('&&&&&&&', photoList)
      // 2. 获取分类列表
      const categoryList = await getCategoryList(config.id, config.sourceType)
      console.log('categoryList', categoryList)
      // 3. 合成下载列表
      const fileList = combineDownloadList(config, title, photoList, categoryList, watermark)

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
          sourceWatermark: config.sourceWatermark
        }
      })
    } catch (e) {
      reject(e)
    }

  })
}

const getPhotoList = async (liveId, downloadType) => {
  let photoList = []
  if (downloadType === 'origin') {
    // 获取原图库
    let arr = []
    try {
      const res = (await api.getOriginAlbumPhotoList({
        albumId: liveId,
        offset: 0,
        limit: 100
      })).data
      const count = Math.ceil(res.total / 100)

      for (let i = 0; i < count; i++) {
        const list = (await api.getOriginAlbumPhotoList({
          albumId: liveId,
          offset: i * 100,
          limit: 100
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
    const res = (await api.getPublishAlbumPhotoList({
      albumId: liveId,
      offset: 0,
      limit: 100
    })).data

    const count = Math.ceil(res.total / 100)

    for (let i = 0; i < count; i++) {
      const list = (await api.getPublishAlbumPhotoList({
        albumId: liveId,
        offset: i * 100,
        limit: 100
      })).data.result

      photoList.push(...list)
    }
  }
  return photoList
}

// 获取分类列表
const getCategoryList = async (id, arg) => {
  try {
    let categoryList
    if (arg === 'origin') {
      categoryList = (await api.getOriginCategory(id)).data.result
    } else {
      categoryList = (await api.getPublishCategory(id)).data.result
    }
    return categoryList
  } catch (e) {
    alert('该活动未添加你为协作者，无法获取到原图库分类')
    throw '该活动未添加你为协作者，无法获取到原图库分类'
  }
}

// 合成下载列表
const combineDownloadList = (config, title, photoList, categoryList, watermark) => {
  let fileList = []
  if (photoList.length > 0) {
    photoList.map(item => {
      console.log('99999', item, config)
      const categoryId = config.sourceType === 'publish' ? item.categoryId : item.originalCategoryId ? item.originalCategoryId : item.categoryId
      const categoryName = getCategoryNameById(categoryId, categoryList) || '默认分类'
      console.log('categoryName', categoryName)
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
      status: 0 // 0:暂停下载 1: 待下载
    })
  }
  return fileList
}

// 获取分类名称
const getCategoryNameById = (id, categoryList) => {
  console.log('******', id, categoryList)
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