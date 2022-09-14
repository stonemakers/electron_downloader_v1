<template>
  <section class="index-container">

    <section class="loading"
             v-if="showLoading">
      <img class="gif"
           src="../assets/loading.png"
           alt=""
           v-if="!showTips">
      <template v-else>
        <section class="avatar"
                 :style="{backgroundImage:  `url(${userInfo.avatar})`}"></section>
        <img class="tipss"
             src="../assets/tips.png"
             alt="">
      </template>
    </section>

    <section class="top">
      <section class="avatar"
               v-if="!isDownloading"
               :style="{backgroundImage:  `url(${userInfo.avatar})`}"></section>
      <img class="gif"
           v-else
           src="../assets/logo.png"
           alt="">
      <template v-if="!isFinished">
        <h1>{{ finishCount }} / {{ downloadList.length }}</h1>
      </template>
      <template v-else>
        <h1 class="finish">下载完毕</h1>
      </template>

    </section>

    <section class="bottom">
      {{ demo }}
      <section class="title"><input readonly
               type="text"
               :value="title"></section>
      <section class="config">
        <span class="name grey">下载配置：</span>
        <span class="content "><span class="t">{{ typeMap[config.type] }}</span> / <span class="t">{{ categoryMap[config.category] }}</span>
          / <span class="t">{{ config.watermark?'有水印':'无水印' }}</span></span>
      </section>
      <section class="save-path">
        <span class="name grey">保存路径：</span>
        <span class="content"><input readonly
                 type="text"
                 :value="downloadFold"></span>
        <section class="choose"
                 v-if="!isDownloading"
                 @click="choosePath">浏览</section>
        <section class="choose disable"
                 v-else>浏览</section>
      </section>

      <template v-if="!isFinished">
        <section class="btn"
                 @click="startDownload"
                 v-if="!isDownloading">开始下载</section>
        <section class="btn pause"
                 @click="pauseDownload"
                 v-else>暂停下载</section>
      </template>

      <template v-else>
        <section class="btn finish-btn"
                 @click="openFold">打开文件夹</section>
      </template>

    </section>
  </section>
</template>
<script>
import { ipcRenderer } from 'electron'
import fs from 'fs'
import request from 'request'
import api from '@/Api'
export default {
  name: 'index',
  components: {},
  props: {},
  data () {
    return {
      showTips: false,
      demo: '',
      config: {
        // 活动ID
        liveId: '',
        // 下载类别
        // origin 下载原图库
        // publish 下载发布图库
        type: '',
        // 下载分类
        // origin 按原图照片分类
        // publish 按发布照片分类
        category: '',
        // 是否有水印
        watermark: true
      },
      showLoading: true,
      isDownloading: false,
      watermark: '',
      title: '',
      isFinished: false,
      photoList: [],
      categoryList: [],
      downloadList: [],
      downloadFold: '',
      typeMap: {
        origin: '原图',
        publish: '发布图'
      },
      categoryMap: {
        origin: '按原图分类',
        publish: '按发布照片分类'
      }
    }
  },
  computed: {
    userInfo () {
      return this.$store.state.user.info
    },
    finishCount () {
      return this.downloadList.filter(item => {
        return item.downloaded === true
      }).length
    }
  },
  methods: {
    async init () {
      const configs = this.$estore.get('config')
      if (configs) {
        const o = this.getQuery(configs)
        this.config = {
          liveId: o.liveId || '',
          type: o.type || '',
          category: o.category || '',
          watermark: o.watermark === 'true' || false
        }
      }
      if (this.config.liveId) {
        this.showLoading = true
        this.showTips = false
        // 检测是否有缓存数据
        const dList = this.$estore.get('downloadList')
        await this.initLive()
        console.log('=====dList', dList)
        if (dList && dList.length > 0) {
          this.downloadList = dList
          this.showLoading = false
          if (this.downloadList.length === this.finishCount) {
            this.isFinished = true
          }
        } else {
          this.downloadList = []
          // 根据配置下载
          await this.getPhotoList(this.config.type)
          await this.getCategoryList(this.config.category)
          await this.handleList()
          // console.log('=====downloadList', this.downloadList)
          this.showLoading = false
        }
      } else {
        this.showLoading = true
        this.showTips = true
      }
    },

    async initLive () {
      const res = (await api.getAlbumById(this.config.liveId)).data
      this.title = res.name
      console.log('=====title', this.title)
      this.watermark = JSON.parse(res.templates) ? JSON.parse(res.templates).waterStr.replace('R1000w', '') : ''
    },

    async getPhotoList (arg) {
      this.photoList = []
      if (arg === 'origin') {
        // 获取原图库
        let arr = []
        const res = (await api.getOriginAlbumPhotoList({
          albumId: this.config.liveId,
          offset: 0,
          limit: 100
        })).data

        const count = Math.ceil(res.total / 100)

        for (let i = 0; i < count; i++) {
          const list = (await api.getOriginAlbumPhotoList({
            albumId: this.config.liveId,
            offset: i * 100,
            limit: 100
          })).data.result

          this.photoList.push(...list)
        }
      } else {
        // 获取发布照片库
        let arr = []
        const res = (await api.getPublishAlbumPhotoList({
          albumId: this.config.liveId,
          offset: 0,
          limit: 100
        })).data

        const count = Math.ceil(res.total / 100)

        for (let i = 0; i < count; i++) {
          const list = (await api.getPublishAlbumPhotoList({
            albumId: this.config.liveId,
            offset: i * 100,
            limit: 100
          })).data.result

          this.photoList.push(...list)
        }
      }
    },

    async getCategoryList (arg) {
      try {
        if (arg === 'origin') {
          this.categoryList = (await api.getOriginCategory(this.config.liveId)).data.result
        } else {
          this.categoryList = (await api.getPublishCategory(this.config.liveId)).data.result
        }
      } catch (e) {
        console.log(e)
      }
    },

    getCategoryNameById (id) {
      if (id) {
        for (let i = 0; i < this.categoryList.length; i++) {
          if (this.categoryList[i].id === id) {
            // console.log('this.categoryList[i].name', this.categoryList[i].name)
            return this.categoryList[i].name
          }
        }
      } else {
        return ''
      }
    },

    handleUrl (url) {
      if (this.config.watermark) {
        return url + '&' + this.watermark
      } else {
        return url
      }
    },

    choosePath () {
      if (ipcRenderer) {
        ipcRenderer.send('choosePath')
      }
    },

    handleList () {
      console.warn('=================')
      this.photoList.map(item => {
        this.downloadList.push({
          id: item.id,
          categoryId: item.categoryId,
          originCategoryId: item.originalCategoryId,
          path: this.getCategoryNameById(this.config.category === 'publish' ? item.categoryId : item.originalCategoryId),
          url: this.handleUrl(item.url),
          name: item.name,
          downloaded: false
        })
      })
    },

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

    async download (pic) {
      return new Promise(async (resolve, reject) => {
        const fold = this.downloadFold
        let req
        let out
        let totalSize = 0
        let receivedBytes = 0
        const headers = await this.getHeaders(pic.url)
        if (headers['content-range']) {
          totalSize = Number(headers['content-range'].split('/')[1]) // 文件总大小
        } else {
          totalSize = 0
        }

        console.log('--- download.js - > totalsize', totalSize)

        if (headers['accept-ranges'] !== 'bytes') {
          // 判断资源是否支持断点下载
          console.log('--- download.js - > 资源不支持断点下载')
          // return
        }
        // const filePath = path.join(store.get('downloadsFolder') + file.savePath + file.name)
        const filePath = `${fold}/${fmtStr(this.title)}/${fmtStr(pic.path)}/${pic.name}`
        console.log('--- filePath: ', filePath)

        function fmtStr (text) {
          return text.replace(/\//g, '').replace(/\\/g, '').replace(/\?/g, '').replace(/\？/g, '').replace(/\*/g, '').replace(/\'/g, '').replace(/\"/g, '').replace(/\>/g, '').replace(/\</g, '').replace(/\|/g, '').replace(/\:/g, '').replace(/\｜/g, '').replace(/\：/g, '')
        }

        let stat
        if (fs.existsSync(filePath)) {
          console.log('--- download.js - > 检测存在该文件')
          stat = fs.statSync(filePath) // 获取文件资源
          receivedBytes = stat.size
          console.log(`--- download.js - > receivedBytes：${receivedBytes}`)
          if (receivedBytes === totalSize) {
            console.log('--- download.js - > 文件已下载完毕')
            resolve()
          }
          if (receivedBytes > totalSize) {
            console.log('--- download.js - > 本地大于网络资源')
            resolve()
          }
        } else {
          // 没有检测到该文件
          fs.mkdirSync(`${fold}/${fmtStr(this.title)}/${fmtStr(pic.path)}`, { recursive: true }, err => {
            console.log('--- download.js - > 创建文件夹错误', err)
          })
          // fs.mkdirSync(`${fold}/${this.title}/${pic.path}`, { recursive: true }, err => {
          //   console.log('--- download.js - > 创建文件夹错误', err)
          // })
        }

        // /Users/stonemaker/Desktop/看这可爱的春天8888/分类2/52883015_5571143_43f5be5c-b777-48ad-b528-67a8f3ad200b.jpg
        // /Users/stonemaker/Desktop/看这可爱的春天8888/分类1/52883015_5571143_7c691d21-4b40-4afd-9420-dfe2c77acb45.jpg



        // ====================================
        // ============ start
        // ====================================

        req = request({
          method: 'GET',
          url: pic.url,
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
                console.log('--- download.js - > receivedBytes', receivedBytes)
              })
            }
          })
          .on('end', () => {
            console.log('=====end')
            out.end()
            resolve()
          })
      })
    },

    getQuery (queryStr) {
      const arr = queryStr.split('&');
      let obj = {}
      for (let item of arr) {
        const keyValue = item.split('=');
        obj[keyValue[0]] = keyValue[1]
      }
      return obj;
    },

    listenIPC () {
      console.log('***************listen')
      ipcRenderer.on('setDownloadFolder', (event, arg) => {
        console.log('监听到了路径：', arg)
        this.$estore.set('downloadFold', arg)
        this.downloadFold = arg
      })

      ipcRenderer.on('demo', (event, arg) => {
        console.log('%%%%%%%%%%demo', arg)
        this.demo = arg
      })

      // yaopai://liveId=1891XW9W2R00&type=publish&category=publish&watermark=false
      ipcRenderer.on('initConfig', (event, arg) => {
        console.log('监听到了配置变化：')


        if (this.$estore.get('config') === arg) {
          // 老链接
          console.log('===老链接')
        } else {
          // 新链接
          console.log('===新链接')
          this.pauseDownload()
          this.$estore.set('downloadList', [])
          this.$estore.set('config', arg)
          this.downloadList = []
          this.isFinished = false
          this.showTips = false
          this.isDownloading = false
        }
        this.init()
      })
    },

    openFold () {
      if (ipcRenderer) {
        ipcRenderer.send('openDownloadFold', this.downloadFold)
      }
    },

    async startDownload () {
      if (this.title) {
        this.isDownloading = true
        for (let i = 0; i < this.downloadList.length; i++) {
          if (this.isDownloading) {
            if (!this.downloadList[i].downloaded) {
              await this.download(this.downloadList[i])
              this.downloadList[i].downloaded = true

              // 持久化下载列表
              this.$estore.set('downloadList', this.downloadList)
              // if (ipcRenderer) {
              //   ipcRenderer.send('setBadge', (this.downloadList.length - this.finishCount))
              // }

              // 下载完毕后的处理
              if (this.downloadList.length === this.finishCount) {
                this.isFinished = true
                if (ipcRenderer) {
                  ipcRenderer.send('notification', {
                    title: '下载通知',
                    body: `完成下载${this.finishCount}张图`
                  })
                }
              }
            } else {

            }
          }
        }
        this.isDownloading = false
      }
    },

    async getCurrentUser () {
      const token = localStorage.getItem('x_token')
      const refresh_token = localStorage.getItem('x_refresh_token')
      if (token) {
        console.log(token)
        const res = await api.getUserInfo(res => {
          const userInfo = {
            id: res.data.id,
            avatar: res.data.avatar,
            nickname: res.data.nickname ? res.data.nickname : '默认用户',
            countryCode: res.data.account.countryCode,
            phoneNo: res.data.account.phoneNo
          }
          this.$store.commit('SET_USER_INFO', userInfo)
        }, () => {
          // 刷新token
          if (refresh_token) {
            api.refreshToken(refresh_token, res => {
              console.log('++++++', res)
              // 把新的令牌存储进去
              if (res && res.status === 200) {
                const token = `${res.data.token_type} ${res.data.access_token}`
                localStorage.setItem('x_token', token)
                localStorage.setItem('x_refresh_token', res.data.refresh_token)
                this.getCurrentUser()
              } else {
                this.$router.replace({
                  path: '/login'
                })
              }
            }, err => {
              console.log('++++error', err)
            })
          } else {
            this.$router.replace({
              path: '/login'
            })
          }
        })
      } else {
        this.$router.replace({
          path: '/login'
        })
      }
    },

    async pauseDownload () {
      this.isDownloading = false
    }
  },
  async mounted () {
    this.downloadFold = this.$estore.get('downloadFold')
    this.listenIPC()
    await this.getCurrentUser()
    this.init()
  }
}
</script>
<style lang="scss" scoped>
.index-container {
  padding: 0 20px;

  .tipss {
    width: 130px;
    display: block;
  }

  .loading {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    flex-direction: column;

    .gif {
      width: 100px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      // background: red;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      margin-bottom: 100px;
    }

    .tipss {
      width: 230px;
    }
  }

  .top {
    width: 100%;
    height: 330px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .gif {
      width: 80px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      // background: red;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
    }

    h1 {
      font-size: 16px;
      margin-top: 40px;
    }
  }

  .bottom {
    font-size: 13px;
    color: #333;
    line-height: 30px;

    .title {
      input {
        font-weight: 900;
      }
    }

    .t {
      // background: rgba(0, 0, 0, 0.05);
      font-size: 13px;
      border-radius: 4px;
    }

    input {
      background: none;
      border: none;
      flex: 1;
      display: inline-flex;
      width: 100%;
      outline: none;
      font-size: 13px;
    }

    .grey {
      color: rgb(187, 187, 187);
    }

    .save-path {
      display: flex;
      margin-top: 0px;
      // background: rgba(0, 0, 0, 0.05);
      border-radius: 5px;
      box-sizing: border-box;
      justify-content: flex-start;

      .content {
        flex: 1;

        input {
          background: none;
          border: none;
          flex: 1;
          display: inline-flex;
          width: 100%;
          outline: none;
        }
      }

      .choose {
        color: #000;
        padding: 0 0 0 15px;
        &:hover {
          cursor: pointer;
          color: #333;
        }
      }

      .disable {
        color: grey;
        padding: 0 0 0 15px;
        &:hover {
          cursor: default;
          color: grey;
        }
      }
    }
  }

  .btn {
    color: #fff;
    font-size: 16px;
    letter-spacing: 1px;
    background: #000;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 17px;
    margin-top: 20px;
    font-weight: 900;

    &:hover {
      cursor: pointer;
      background: #333;
    }
  }

  .pause {
    color: #000;
    font-size: 16px;
    letter-spacing: 1px;
    background: #ffff33;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 17px;
    margin-top: 20px;
    font-weight: 900;

    &:hover {
      cursor: pointer;
      background: #e0e02b;
    }
  }

  .finish {
    color: #000;
  }

  .finish-btn {
    background: #000;
    color: #fff;
  }
}
</style>
