import api from '@/Api.js'
import { ipcRenderer } from 'electron'

// {
//   downloadType: 'fold', // 文件夹
//   id: '3HR844F00400', // 文件夹id
// }
let path = ''
let fileList = []
let title = ''
export default async config => {
  return new Promise(async (resolve, reject) => {
    try {
      fileList = []
      const res = await api.getStructure({
        directoryId: config.id,
        limit: 100,
        offset: 0
      })
      title = res.data.name
     
      await recursionFold(config.id, title, path)

      resolve({
        type: config.downloadType,
        taskId: new Date().getTime() + parseInt(Math.random() * 1000),
        title: title,
        status: 0,
        fileList: fileList,
        finished: false
      })
    } catch (e) {
      ipcRenderer.send('alert', '无文件夹访问权限，请加入协作者重试')
      // alert('无文件夹访问权限，请加入协作者重试')
      reject(e)
    }
  })
}

// 递归文件夹
async function recursionFold (id, name, p) {
  // console.log('===p', p)
  // console.log('===name', name)
  let nPath = p + '/' + name
  // console.log('===nPath', nPath)
  let foldArr = []
  const res = await api.getStructure({
    directoryId: id,
    limit: 100,
    offset: 0
  })

  for (let j = 0; j < Math.ceil(res.data.total / 100); j++) {
    const _res = await api.getStructure({
      directoryId: id,
      limit: 100,
      offset: j * 100
    })

    const l = _res.data.files
    for (let i = 0; i < l.length; i++) {
      // console.log('===当前路径：', `${nPath}/${l[i].name}`)
      console.log('=====插入一个false')
      fileList.push({
        url: l[i].url,
        savePath: `${nPath}/${l[i].name}`, 
        fold: `${nPath}`,
        downloaded: false,
        status: 0 // 0:暂停下载 1: 待下载
      })
    }
    foldArr.push(..._res.data.children)
  }
  for (let i = 0; i < foldArr.length; i++) {
    await recursionFold(foldArr[i].id, foldArr[i].name, p + '/' + name)
  }
}