<template>
  <section class="index-container">
    <!-- loading -->
    <x-loading v-if="loading"></x-loading>
    <!-- 任務解析 -->
    <section class="mask" v-if="showAdd">
      <h1>请输入解析网址</h1>
      <textarea name="" id="" rows="10" v-model="urlStr"></textarea>
      <section class="ok" @click="startHandle(urlStr)">开始解析</section>
      <section class="cancel" @click="cancelHandle">返回</section>
    </section>
    <section class="header" :class="{ scale: scaleMin }">
      <h1 class="title">
        正在下载 {{ taskList.length }} <span class="speed">{{ speed }} Mb/s</span>
      </h1>
      <section class="avatar" @click="logout" :style="{ backgroundImage: `url(${userInfo.avatar})` }"></section>
    </section>

    <!-- 下载列表 -->
    <section class="download-list" v-if="taskList.length > 0">
      <section class="item" v-for="(item, index) in taskList" :key="index">
        <section class="process-mask" :style="{ width: calcProcess(item) + '%' }"></section>
        <section class="symbol" v-if="item">
          <x-icon :type="handleType(item.type).icon"></x-icon>
        </section>

        <section class="name" v-if="item" :title="item.title">
          {{ item.title }}
          <section class="symbol2" v-if="item.type === 'photoLive'">
            [{{ item.desc.sourceName }}] {{ item.desc.source === 'origin' ? '原片下载' : '发布照片下载' }} |
            {{ getTName2(item.desc.sourceType) }} | {{ item.desc.sourceWatermark ? '水印' : '无印' }}
          </section>
          <section class="symbol2" v-else>{{ handleType(item.type).name }}</section>
        </section>
        <section class="process">{{ calcProcess(item) }}%</section>
        <section class="handle-wrapper">
          <section
            class="icon-start"
            @click="startDownload(item.taskId)"
            v-if="item.status === 0 && !item.finished"
            title="开始下载"
          >
            <x-icon type="start"></x-icon>
          </section>
          <section
            class="icon-pause"
            @click="pauseDownload(item.taskId)"
            v-else-if="item.status === 1 && !item.finished"
            title="暂停下载"
          >
            <x-icon type="pause"></x-icon>
          </section>
          <section class="icon-pause" @click="openFold(item)" v-else title="打开目录">
            <x-icon type="folder"></x-icon>
          </section>
          <section class="icon-delete" @click="removeDownload(item.taskId)" title="删除任务">
            <x-icon type="close"></x-icon>
          </section>
        </section>
      </section>
    </section>

    <section class="download-list" v-else>
      <p class="tip">
        <x-icon type="none"></x-icon>
      </p>
    </section>

    <!-- 底栏 -->
    <section class="footer">
      <section class="logo">
        <x-icon type="logo"></x-icon>
        <p class="version">{{ $version }}</p>
      </section>
      <section class="handle-wrapper">
        <section class="icon-start" @click="addTask" title="新建任务">
          <x-icon type="add"></x-icon>
        </section>
        <section class="icon-start" @click="startAllTask" v-if="!startAll || taskCount === 0" title="全部开始">
          <x-icon type="start"></x-icon>
        </section>
        <section class="icon-start" @click="pauseAll" v-else title="全部暂停">
          <x-icon type="pause"></x-icon>
        </section>
        <section class="icon-start" @click="deleteAll" title="全部删除">
          <x-icon type="close"></x-icon>
        </section>
        <section class="icon-delete" @click="setup" title="设置">
          <x-icon type="setup"></x-icon>
        </section>
      </section>
    </section>
  </section>
</template>
<script>
import { ipcRenderer } from 'electron'
import loadData from '@/utils/download.js'
import api from '@/Api'
import XLoading from '@/components/XLoading/Index.vue'
// import downloadPhotoLive from '@/utils/photoLive.js'
// import downloadCloudAlbum from '@/utils/cloudAlbum.js'
// import downloadFile from '@/utils/file.js'
// import downloadShareFold from '@/utils/shareFold.js'
// import downloadFold from '@/utils/fold.js'

export default {
  name: 'index',
  components: {
    XLoading
  },
  props: {},
  data() {
    return {
      scaleMin: false,
      queue: [],
      taskCount: 0,
      startAll: false,
      loading: false,
      urlStr: '',
      showAdd: false,
      speed: 0,
      timmer: {},
      taskConfig: {
        env: 'pro', // 测试环境（dev）, 生产环境（pro）
        downloadList: [
          {
            downloadType: 'cloudAlbum', // 云相册
            id: '33VEGTXM0M00', // 云相册id
            sourceWatermark: true // 是否带水印
          },
          {
            downloadType: 'photoLive', // 照片直播
            id: '3C96J23W5S00', // 照片直播id
            source: 'publish', // 下载源
            sourceType: 'publish', // 下载分类
            sourceWatermark: false // 是否带水印
          },
          {
            downloadType: 'photoLive', // 照片直播
            id: '3C95VHA05S00', // 照片直播id
            source: 'publish', // 下载源
            sourceType: 'publish', // 下载分类
            sourceWatermark: false // 是否带水印
          },
          // {
          //   暂未支持
          //   downloadType: 'asset', // 素材库
          //   id: '2838384884', // 素材id
          // },
          {
            downloadType: 'file', // 文件
            name: '3HQ8975G0400.exe', // 文件名
            url: 'https://api-sta.devops.back.aiyaopai.com/object/1d63c54d/3HQ8975G0400.exe?t=ZXhwaXJlcz04NjQwMCZ0aW1lc3RhbXA9MTY2NzExNzQwNiZzaWduPTdmNTQ1ZDg5ZmE'
          },
          {
            downloadType: 'shareFold', // 文件夹
            id: '3PHNHCNW0400', // 文件夹id
            password: 'AVX0' // 分享密码
          },
          {
            downloadType: 'fold', // 文件夹
            id: '2VGXRQ680B00' // 文件夹id
          }
        ]
      },
      taskList: []
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.info
    }
    // downloadTask () {
    //   return this.$estore.get('downloadTask')
    // },
  },
  watch: {
    // downloadTask () {
    //   // console.log('bianhuale')
    // },
    userInfo() {
      this.checkVersion()
    },
    taskList(n, o) {
      // console.log('变化了')
      window.localStorage.setItem('dTask', JSON.stringify(n))
    },
    queue() {}
  },
  methods: {
    getTName2(type) {
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
    },
    async checkVersion() {
      const v = (await api.getVersion()).data

      const v_now = this.$version
      console.log('*********v2: ', v, v_now)
      if (v !== v_now) {
        if (window.confirm(`发现新版本${v},当前版本${v_now}，是否下载最新版本？`)) {
          ipcRenderer.send('update', v)
        }
      }
    },
    removeDownload(taskId) {
      this.pauseDownload(taskId)
      let index = this.taskList.findIndex((item) => item.taskId === taskId)
      console.log('找到index', index)
      this.taskList.splice(index, 1)
      console.log('剩余', this.taskList.length)
      // const currentTask = this.taskList.find(item => item.taskId === taskId)
      // const task = this.$estore.get('downloadTask')
      // task.downloadList = this.taskList
      // this.$estore.set('downloadTask', task)
    },
    cancelHandle() {
      this.showAdd = false
    },
    openFold(task) {
      if (ipcRenderer) {
        if (task.type === 'file') {
          ipcRenderer.send('openDownloadFold', this.$estore.get('downloadFold'))
        } else {
          ipcRenderer.send('openDownloadFold', this.$estore.get('downloadFold') + '/' + task.title)
        }
      }
    },
    startHandle(str) {
      // =====思路如下=====
      // 新建一个窗口
      // 将str传递给该窗口
      // 在窗口中执行该解析方法
      // 将解析后的内容传递给本窗口
      // 关闭窗口
      // this.createNewWindow()
      this.loading = true
      this.showAdd = false
      this.urlStr = ''
      ipcRenderer.send('createNewWindow', {
        message: decodeURI(str)
      })
    },
    addTask() {
      // console.log(1)
      this.showAdd = true
    },
    setup() {
      this.$router.push({
        name: 'setup'
      })
    },
    // 计算进度
    calcProcess(task) {
      if (task) {
        let p
        const downloadedCount = task.fileList.filter((item) => item.downloaded === true).length
        const totalCount = task.fileList.length

        if (totalCount === 0) {
          p = 100
        } else {
          p = parseInt((downloadedCount / totalCount) * 100)
        }

        if (p === 100) {
          task.finished = true
        }
        return p
      } else {
        return 0
      }
    },
    getQuery(queryStr) {
      try {
        // console.log(1, queryStr.split('env=')[1])
        const str = 'env=' + queryStr.split('env=')[1]
        // console.log(2, str)
        const str1 = str.split('env=')[1]
        // console.log(3, str1)
        const env = str1.split('&')[0]
        // console.log(4, env)
        const downloadList = decodeURI(str.split('downloadList=')[1])
        // console.log(5, downloadList)
        const obj = {
          env: env,
          downloadList: JSON.parse(downloadList)
        }
        // console.log('========00000', obj)
        return obj
      } catch (e) {
        return {}
      }
    },
    getNewQueue(task) {
      let fl
      for (let i = 0; i < task.fileList.length; i++) {
        if (!task.fileList[i].downloaded && !task.fileList[i].inQueue) {
          fl = task.fileList[i]
          break
        }
      }
      console.log('---task', fl)
      return fl
    },
    async startAllTask() {
      this.taskCount = this.taskList.length
      this.startAll = true

      for (let i = 0; i < this.taskList.length; i++) {
        this.startDownload(this.taskList[i].taskId)
      }
    },
    pauseAll() {
      if (this.timmer) {
        // window.clearInterval(this.timmer)
      }
      this.startAll = false
      // this.taskList.map(item => {
      //   this.pauseDownload(item.taskId)
      // })
      for (let i = 0; i < this.taskList.length; i++) {
        this.pauseDownload(this.taskList[i].taskId)
      }
    },
    deleteAll() {
      if (this.timmer) {
        // window.clearInterval(this.timmer)
      }
      // console.log(this.taskList, this.taskList.length)
      const list = this.taskList.concat()
      console.log('list', list)
      if (window.confirm('确认删除所有项目么')) {
        for (let i = 0; i < list.length; i++) {
          console.log(i)
          this.removeDownload(list[i].taskId)
        }
      }
    },
    down(task, fileItem) {
      if (fileItem) {
        fileItem.inQueue = true
        // 获取当前任务队列
        // 如果队列任务小于3，则添加任务到队列，
        // 队列任务同时进行下载，单个任务下载完毕后，移除队列，添加新任务到队列中
        // console.log(fileItem.savePath, fileItem.fold)
        loadData.download(fileItem.url, fileItem.savePath, fileItem.fold).then((res) => {
          // console.log('下载完毕')
          fileItem.downloaded = true
          const nFileItem = this.getNewQueue(task)
          if (nFileItem) {
            // 开始下载
            // console.log('=====nFileItem', nFileItem.url)
            this.down(task, nFileItem)
          }
        })
      }
    },

    startDownload2(taskId) {
      ipcRenderer.send('startDownloadTask', {
        message: taskId
      })
    },

    doDownload(obj) {
      return new Promise((resolve, reject) => {
        console.log('========5555', encodeURI(JSON.stringify(obj)))
        ipcRenderer.send('startDownloadTask', {
          message: obj
        })
      })
    },

    async startDownload(taskId) {
      console.log('------path', this.$estore.get('downloadFold'))
      // console.log('this.taskList',this.taskList)
      // 1. 获取当前下载任务

      console.log('111', taskId)
      const currentTask = await this.taskList.find((item) => item.taskId === taskId)
      console.log('222', currentTask)
      currentTask.status = 1
      // this.taskList.find(item => item.taskId === taskId).status = 1
      // this.$set(currentTask, 'status', 1)
      const fileList = currentTask.fileList

      // 2. 获取当前任务池队列
      // let taskPond = this.$estore.get('taskPond') || []
      // 3. 将下载任务插入任务池中，状态改为待下载
      fileList.map((item) => {
        item.status = 1
        // taskPond.push(item)
      })
      console.log('333', fileList)
      // this.$estore.set('taskPond', taskPond)
      // console.log('====taskPond: ',this.$estore.get('taskPond'))
      for (let i = 0; i < fileList.length; i++) {
        // console.log(currentTask.status, fileList[i].downloaded)
        if (currentTask.status === 1) {
          if (!fileList[i].downloaded) {
            // console.log(fileList[i].savePath, fileList[i].fold)
            await loadData.download(fileList[i].url, fileList[i].savePath, fileList[i].fold)
            // await this.doDownload({
            //   url: fileList[i].url,
            //   savePath: fileList[i].savePath,
            //   fold: fileList[i].fold
            // })
            fileList[i].downloaded = true
          }
        } else {
          break
        }
      }
      this.taskCount--
    },

    pauseDownload(taskId) {
      // 1. 获取当前下载任务
      const currentTask = this.taskList.find((item) => item.taskId === taskId)
      currentTask.status = 0
      // const fileList = currentTask.fileList
      // 2. 获取当前任务池队列
      // let taskPond = this.$estore.get('taskPond') || []
      // 3. 将当前任务移除下载队列，状态改为暂停下载
      // fileList.map(item => {
      //   item.status = 0
      //   const index = taskPond.findIndex(it => it.id === item.id)
      //   taskPond.splice(index, 1)
      // })
      // this.$estore.set('taskPond', taskPond)
      // console.log('====taskPond: ',this.$estore.get('taskPond'), fileList)
    },
    handleType(val) {
      if (val === 'cloudAlbum') {
        return {
          name: '云相册',
          icon: 'd'
        }
      }
      if (val === 'photoLive') {
        return {
          name: '照片直播',
          icon: 'b'
        }
      }
      if (val === 'file') {
        return {
          name: '文件',
          icon: 'e'
        }
      }
      if (val === 'fold') {
        return {
          name: '文件夹',
          icon: 'f'
        }
      }
      if (val === 'shareFold') {
        return {
          name: '分享文件夹',
          icon: 'a'
        }
      }
      if (val === 'publicFile') {
        return {
          name: '素材库',
          icon: 'f'
        }
      }
    },
    async getCurrentUser() {
      const token = localStorage.getItem('x_token')
      const refresh_token = localStorage.getItem('x_refresh_token')
      if (token) {
        const res = await api.getUserInfo(
          (res) => {
            const userInfo = {
              id: res.data.id,
              avatar: res.data.avatar,
              nickname: res.data.nickname ? res.data.nickname : '默认用户',
              countryCode: res.data.account.countryCode,
              phoneNo: res.data.account.phoneNo
            }
            this.$store.commit('SET_USER_INFO', userInfo)
          },
          () => {
            // 刷新token
            if (refresh_token) {
              api.refreshToken(
                refresh_token,
                (res) => {
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
                },
                (err) => {
                  // console.log('++++error', err)
                }
              )
            } else {
              this.$router.replace({
                path: '/login'
              })
            }
          }
        )
      } else {
        this.$router.replace({
          path: '/login'
        })
      }
    },
    logout() {
      if (window.confirm('清除缓存并退出登录？')) {
        ipcRenderer.send('clearData')
        localStorage.clear()
        this.$router.replace({
          path: '/login'
        })
      }
    },
    listenScroll() {
      // 根据下拉更改头部高度
      window.addEventListener(
        'scroll',
        () => {
          if (window.scrollY > 50) {
            this.scaleMin = true
          } else {
            this.scaleMin = false
          }
        },
        false
      )
    },
    calcSpeed() {
      let sp = 0
      this.timmer = setInterval(() => {
        // console.log(`速度：${loadData.calculateGlobalDownloadSpeed()} MB/s`)
        this.speed = loadData.calculateGlobalDownloadSpeed()

        console.log('====', this.speed)
      }, 1000)
    },
    // 监听下载器动作
    listenIPC() {
      ipcRenderer.on('initConfig', (event, arg) => {
        console.log('监听到了配置变化：', decodeURI(arg))
        // 若用户未登录，则不跳转

        if (this.userInfo.id) {
          if (decodeURI(arg).length > 0) {
            this.loading = true
            ipcRenderer.send('createNewWindow', {
              message: decodeURI(arg)
            })
          }
        }
      })

      ipcRenderer.on('loadingTask', (event, arg) => {
        console.log('======loading', arg)
        this.loading = arg
      })

      ipcRenderer.on('console', (event, arg) => {
        console.log(arg)
      })

      ipcRenderer.on('alert', (event, arg) => {
        alert(arg)
      })

      ipcRenderer.on('pushTask', (event, arg) => {
        console.log('---task', arg)
        this.taskList.push(arg)
      })
    },
    async init(taskConfig) {
      // console.log('====3333',taskConfig)
      // this.taskList = []
      this.loading = true
      try {
        if (taskConfig) {
          // 解析任务数据
          // this.$estore.set('env', taskConfig.env || 'pro')
          // 构建下载队列
          const list = taskConfig.downloadList
          console.log('&&&&当前任务队列数量', list.length)
          for (let j = 0; j < list.length; j++) {
            if (list[j].downloadType === 'photoLive') {
              console.log('=====1')
              // 是照片直播
              const taskItem = await downloadPhotoLive(list[j])
              console.log(222222, taskItem)
              // console.log(taskItem)
              this.taskList.push(taskItem)
              this.loading = false
            }
            if (list[j].downloadType === 'cloudAlbum') {
              // 是照片直播
              const taskItem = await downloadCloudAlbum(list[j])
              // console.log(taskItem)
              this.taskList.push(taskItem)
            }
            if (list[j].downloadType === 'file') {
              // 是文件下载
              const taskItem = await downloadFile(list[j])
              // console.log('*****',taskItem)
              this.taskList.push(taskItem)
            }
            if (list[j].downloadType === 'shareFold') {
              // 是分享文件夹下载
              // console.log('#############')
              const taskItem = await downloadShareFold(list[j])
              console.log('是分享文件夹下载', taskItem)
              this.taskList.push(taskItem)
            }
            if (list[j].downloadType === 'fold') {
              // 是文件夹下载
              console.log('是文件夹下载#############', list[j])
              const taskItem = await downloadFold(list[j])
              console.log('是文件夹下载', taskItem)
              this.taskList.push(taskItem)
            }
          }
          this.loading = false
          console.log(this.taskList)
        }
      } catch (e) {
        console.log('%%%%%% %%')
        this.loading = false
      }
    }
  },
  async mounted() {
    // =====思路如下=====
    // 新建一个窗口
    // 将str传递给该窗口
    // 在窗口中执行该解析方法
    // 将解析后的内容传递给本窗口
    // 关闭窗口
    // console.log(this.$estore.get('downloadFold'))
    // this.$estore.set('downloadTask', {})
    this.listenScroll()
    await this.getCurrentUser()
    this.listenIPC()
    // 获取配置文件
    // this.taskConfig = this.$estore.get('downloadTask')·
    // console.log('=====',this.taskConfig)
    // if(this.taskConfig){
    //   this.init(this.taskConfig)
    // }
    // this.init(this.taskConfig)
    // console.log('process.versions',process.versions)
    // 获取版本号
    // await api.setVersion('3.6.8')

    // 获取下载速度
    // 每秒计算一次全局下载速度
    this.calcSpeed()
  }
}
</script>
<style lang="scss" scoped>
.index-container {
  position: relative;
  color: #4b4b4b;

  .mask {
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    background: #fff;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 998;

    textarea {
      width: 100%;
      margin-bottom: 10px;
      background: #efefef;
      border-radius: 10px;
      border: 0;
    }

    .cancel {
      background: #efefef;
      color: #000;
      padding: 20px 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 35px;
      border-radius: 10px;
      font-size: 12px;
      margin-bottom: 10px;

      &:hover {
        cursor: pointer;
      }
    }

    .ok {
      background: #000;
      color: #fff;
      padding: 20px 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 35px;
      border-radius: 10px;
      font-size: 12px;
      margin-bottom: 10px;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .icon-delete {
    color: #999;
  }
  .header {
    height: 80px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    box-sizing: border-box;
    position: fixed;
    background: #fff;
    width: 100%;
    left: 0;
    top: -20px;
    transition: all 0.3s;
    border-bottom: 0.5px solid #efefef;
    z-index: 10;

    h1 {
      display: flex;
      align-items: center;
    }

    .title {
      font-size: 24px;
      transition: all 0.3s;
    }

    .speed {
      font-size: 12px;
      font-weight: 400;
      color: grey;
      margin-left: 10px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: black;
      border-radius: 50%;
      background-size: cover;
      background-repeat: no-repeat;
      transition: all 0.3s;

      &:hover {
        cursor: pointer;
        filter: brightness(80%);
      }
    }
  }

  .scale {
    height: 40px;
    .title {
      font-size: 16px;
    }
    .avatar {
      width: 20px;
      height: 20px;
    }
  }

  .download-list {
    padding-bottom: 80px;
    padding-top: 80px;

    .tip {
      font-size: 100px;
      color: #666;
      width: 100%;
      text-align: center;
      margin-top: 20vh;
    }

    .item {
      display: flex;
      padding: 0 15px;
      box-sizing: border-box;
      justify-content: flex-start;
      font-weight: 600;
      align-items: center;
      height: 50px;
      position: relative;

      .process-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f4f4f8;
        z-index: -1;
      }

      &:hover {
        background: #efefef;
        cursor: pointer;
      }

      .symbol {
        // background: #000000;
        font-size: 23px;
        width: 30px;
        display: flex;
        align-items: center;
        color: #fff;
        margin-right: 10px;
        // background: #f3f3f3;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
      }

      .symbol2 {
        font-size: 10px;
        border-radius: 5px;
        font-weight: 400;
        height: 12px;
        display: flex;
        align-items: center;
        color: #989898;
        margin-right: 5px;
        line-height: 18px;
      }

      .name {
        font-size: 14px;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .process {
        font-size: 14px;
        width: 60px;
        text-align: center;
      }

      .handle-wrapper {
        display: flex;
        width: 50px;
        justify-content: space-around;
        .icon-start {
          color: #666;
        }
        .icon-start,
        .icon-delete {
          &:hover {
            color: #000;
          }
        }
      }
    }
  }

  .footer {
    background: #f4f4f8;
    border-radius: 30px 30px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px 0 20px;
    box-sizing: border-box;

    .logo {
      font-weight: 900;
      font-size: 120px;
      position: relative;
      .version {
        position: absolute;
        color: #c1c1c1;
        z-index: 2;
        bottom: 76px;
        left: 126px;
        font-size: 9px;
      }
      &:hover {
        cursor: pointer;
        color: #000;
      }
    }

    .handle-wrapper {
      display: flex;
      width: 160px;
      padding-right: 10px;
      justify-content: space-around;
      .icon-start,
      .icon-delete {
        font-size: 25px;
        &:hover {
          cursor: pointer;
          color: #000;
        }
      }
    }
  }
}
</style>
