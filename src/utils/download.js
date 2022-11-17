import fs from 'fs'
import request from 'request'
import Store from 'electron-store'
const store = new Store()

export default {
  getHeaders (url) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: url,
          method: 'GET',
          forever: true,
          headers: {
            // 请求头
            'Cache-Control': 'no-cache',
            Range: 'bytes=0-1'
          }
        },
        (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res.headers)
          }
        }
      )
    })
  },

  async download (url, path, foldPath) {
    return new Promise(async (resolve, reject) => {
      let req
      let out
      let totalSize = 0
      let receivedBytes = 0
      // console.log('url:=====', url)
      const headers = await this.getHeaders(url)
      // console.log("++++++headers", headers)
      if (headers['content-range']) {
        totalSize = Number(headers['content-range'].split('/')[1]) // 文件总大小
      } else {
        totalSize = 0
      }

      // console.log('--- download.js - > totalsize', totalSize)

      if (headers['accept-ranges'] !== 'bytes') {
        // 判断资源是否支持断点下载
        console.log('--- download.js - > 资源不支持断点下载')
        // return
      }
      // const filePath = path.join(store.get('downloadsFolder') + file.savePath + file.name)
      const filePath = store.get('downloadFold')+'/'+path
      console.log('--- filePath: ', filePath)

      function fmtStr (text) {
        return text.replace(/\//g, '').replace(/\\/g, '').replace(/\?/g, '').replace(/\？/g, '').replace(/\*/g, '').replace(/\'/g, '').replace(/\"/g, '').replace(/\>/g, '').replace(/\</g, '').replace(/\|/g, '').replace(/\:/g, '').replace(/\｜/g, '').replace(/\：/g, '')
      }

      let stat
      if (fs.existsSync(filePath)) {
        // console.log('--- download.js - > 检测存在该文件')
        stat = fs.statSync(filePath) // 获取文件资源
        receivedBytes = stat.size
        // console.log(`--- download.js - > receivedBytes：${receivedBytes}`)
        if (receivedBytes === totalSize) {
          // console.log('--- download.js - > 文件已下载完毕')
          resolve()
        }
        if (receivedBytes > totalSize) {
          // console.log('--- download.js - > 本地大于网络资源')
          resolve()
        }
      } else {
        // 没有检测到该文件
        console.log('chuangjianwen减价', store.get('downloadFold')+'/'+foldPath)
        fs.mkdirSync(store.get('downloadFold')+'/'+foldPath, { recursive: true }, err => {
          console.log('--- download.js - > 创建文件夹错误', err)
        })
      }

      req = request({
        method: 'GET',
        url: url,
        forever: true,
        headers: {
          // 请求头
          'Cache-Control': 'no-cache',
          Range: `bytes=${receivedBytes}-${totalSize - 1}`
        }
      })

      out = fs.createWriteStream(filePath, {
        flags: 'a'
      })

      req
        .on('data', chunk => {
          if (out) {
            out.write(chunk, async () => {
              receivedBytes += chunk.length
              // console.log('--- download.js - > receivedBytes', receivedBytes)
            })
          }
        })
        .on('end', () => {
          // console.log('=====end')
          out.end()
          resolve()
        })
    })
  },
}