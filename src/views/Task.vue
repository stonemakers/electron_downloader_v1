<template>
  <section class="task-container">task2</section>
</template>
<script>
import downloadPhotoLive from '@/utils/photoLive.js'
import downloadPublicFile from '@/utils/publicFile.js'
import downloadCloudAlbum from '@/utils/cloudAlbum.js'
import downloadFile from '@/utils/file.js'
import downloadShareFold from '@/utils/shareFold.js'
import downloadFold from '@/utils/fold.js'
import { ipcRenderer } from 'electron'
export default {
  /******************************************
   ** task 任务处理进程
   * @description 组件描述
   * @author stone
   *****************************************/
  name: 'task',
  components: {},
  props: {},
  data() {
    return {}
  },
  computed: {},
  methods: {
    handleConfig(str) {
      try {
        const target = this.getQuery(str)
        this.init(target)
      } catch (e) {
        throw e
      }
    },
    async init(taskConfig) {
      // this.loading = true /////////////////////
      ipcRenderer.send('loadingTask', true)
      try {
        if (taskConfig) {
          // 解析任务数据
          // this.$estore.set('env', taskConfig.env || 'pro')
          // 构建下载队列
          const list = taskConfig.downloadList
          console.log('&&&&当前任务队列数量', list.length, list)
          for (let j = 0; j < list.length; j++) {
            if (list[j].downloadType === 'photoLive') {
              console.log('=====1')
              // 是照片直播
              const taskItem = await downloadPhotoLive(list[j])
              console.log(222222, taskItem)
              // console.log(taskItem)
              // this.taskList.push(taskItem)  /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
            }
            if (list[j].downloadType === 'cloudAlbum') {
              // 是照片直播
              const taskItem = await downloadCloudAlbum(list[j])
              // console.log(taskItem)
              // this.taskList.push(taskItem) /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
            }
            if (list[j].downloadType === 'file') {
              // 是文件下载
              const taskItem = await downloadFile(list[j])
              console.log('*****是文件下载')
              // this.taskList.push(taskItem) /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
              // console.log('*****关闭loading')
            }
            if (list[j].downloadType === 'shareFold') {
              // 是分享文件夹下载
              // console.log('#############')
              const taskItem = await downloadShareFold(list[j])
              console.log('是分享文件夹下载', taskItem)
              // this.taskList.push(taskItem) /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
            }
            if (list[j].downloadType === 'fold') {
              // 是文件夹下载
              console.log('是文件夹下载#############', list[j])
              const taskItem = await downloadFold(list[j])
              console.log('是文件夹下载', taskItem)
              // this.taskList.push(taskItem) /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
            }
            if (list[j].downloadType === 'publicFile') {
              // 是素材视频库下载
              // console.log('是素材视频库下载#############', list[j])
              const taskItem = await downloadPublicFile(list[j])
              console.log('是素材视频库下载', taskItem)
              // this.taskList.push(taskItem) /////////////////////
              // ipcRenderer.send('loadingTask', false)
              ipcRenderer.send('pushTask', taskItem)
            }
          }
          // this.loading = false /////////////////////
          ipcRenderer.send('loadingTask', false)
          // ipcRenderer.send('destroy')
        }
      } catch (e) {
        console.log('%%%%%% %%', e)
        // this.loading = false /////////////////////
        ipcRenderer.send('loadingTask', false)
        // ipcRenderer.send('destroy')
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
    }
  },
  mounted() {
    ipcRenderer.send('window-load-success')
    ipcRenderer.on('loadFinished', (event, args) => {
      console.log('======loadFinished', args)
      this.handleConfig(args)
    })
  }
}
</script>
<style lang="scss" scoped>
</style>
