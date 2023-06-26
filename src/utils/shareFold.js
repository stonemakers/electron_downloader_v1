import api from '@/Api.js'
import { ipcRenderer } from 'electron'

// {
//   downloadType: 'shareFold', // 文件夹
//   id: '3HR844F00400', // 文件夹id
//   password: 'BFX8' // 分享密码
// }
let fileList = []
let folds = []
let path = '/分享的文件'
export default async (config) => {
  path = '/分享的文件'
  return new Promise(async (resolve, reject) => {
    try {
      fileList = []
      if (config.password) {
        // console.log(1111)
        // 有密码
        const res = await api.verifySharePassword(config.id, config.password)
        // console.log('======res', res)
        if (res.data.state === 1) {
          // 校验通过
          const fold = await api.getFold(config.id, config.password)
          folds = fold.data.directories
          console.log('folds', folds)
          const l = fold.data.files
          for (let i = 0; i < l.length; i++) {
            fileList.push({
              url: l[i].url,
              savePath: `${path}/${l[i].name}`,
              fold: `${path}`,
              downloaded: false,
              status: 0 // 0:暂停下载 1: 待下载
            })
          }
          for (let i = 0; i < folds.length; i++) {
            await recursionFold(folds[i].expandToken, folds[i].name, path)
          }
          console.log('====fileList', fileList)

          if (fileList.length === 0) {
            fileList.push({
              id: Math.random().toString(16),
              url: '',
              savePath: `${path}`,
              fold: `${path}`,
              downloaded: false,
              status: 0 // 0:暂停下载 1: 待下载1
            })
          }
          let title = '分享的文件'
          const dTask = JSON.parse(window.localStorage.getItem('dTask'))
          if (dTask) {
            dTask.map(item => {
              if (item.title === title) {
                title += '_1'
              }
            })
          }

          resolve({
            type: config.downloadType,
            taskId: Math.random().toString(16),
            title: title,
            status: 0,
            fileList: fileList,
            finished: false
          })
        } else {
          reject(e)
        }
      } else {
        // 无密码
        const res = await api.verifySharePassword(config.id, config.password)
        // console.log('======ressss', res)
        if (res.data.state === 1) {
          // 校验通过
          const fold = await api.getFold(config.id, config.password)
          folds = fold.data.directories
          console.log('folds', folds)
          const l = fold.data.files
          for (let i = 0; i < l.length; i++) {
            fileList.push({
              url: l[i].url,
              savePath: `${path}/${l[i].name}`,
              fold: `${path}`,
              downloaded: false,
              status: 0 // 0:暂停下载 1: 待下载
            })
          }
          for (let i = 0; i < folds.length; i++) {
            await recursionFold(folds[i].expandToken, folds[i].name, path)
          }
          // console.log('====fileList', fileList)

          // if(fileList.length===0){
          //   fileList.push({
          //     id: Math.random().toString(16),
          //     url: '', 
          //     savePath: `${path}`,
          //     fold: `${path}`,
          //     downloaded: false,
          //     status: 0 // 0:暂停下载 1: 待下载1
          //   })
          // }

          resolve({
            type: config.downloadType,
            taskId: Math.random().toString(16),
            title: '分享的文件',
            status: 0,
            finished: false,
            fileList: fileList
          })
        } else {
          reject(e)
        }
      }
    } catch (e) {
      ipcRenderer.send('alert', '无法访问该文件夹')
      reject(e)
    }
  })
}
// 递归文件夹
async function recursionFold(token, name, p) {
  // console.log('===name', name)
  // console.log('===p', p)
  let nPath = p + '/' + name
  // console.log('===nPath', nPath)
  let foldArr = []
  if (token) {
    const res = await api.getChildFold({
      expandToken: token,
      limit: 100,
      offset: 0
    })
    console.log('=====res', res.data)

    if (res.data.total > 0) {
      for (let j = 0; j < Math.ceil(res.data.total / 100); j++) {
        const _res = await api.getChildFold({
          expandToken: token,
          limit: 100,
          offset: j * 100
        })
        const l = _res.data.files
        for (let i = 0; i < l.length; i++) {
          fileList.push({
            url: l[i].url,
            savePath: `${nPath}/${l[i].name}`,
            fold: `${nPath}`,
            downloaded: false,
            status: 0 // 0:暂停下载 1: 待下载
          })
        }
        foldArr.push(..._res.data.directories)
      }
    } else {
      fileList.push({
        url: '',
        savePath: `${nPath}`,
        fold: `${nPath}`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
    }



    for (let i = 0; i < foldArr.length; i++) {
      await recursionFold(foldArr[i].expandToken, foldArr[i].name, p + '/' + name)
    }
  }
}