<template>
  <section class="download-container">download</section>
</template>
<script>
import loadData from '@/utils/download.js'
import { ipcRenderer } from 'electron'
export default {
  /******************************************
   ** 下载进程
   * @description 组件描述
   * @author stone
   *****************************************/
  name: 'download',
  components: {},
  props: {},
  data() {
    return {}
  },
  computed: {},
  methods: {},
  mounted() {
    ipcRenderer.send('download-process-ready')
    console.log('===================this.$route', decodeURI(this.$route.query.task))
    ipcRenderer.on('downloadStart', async (event, args) => {
      console.log('=====gagaagag  downloadStart', args)
      loadData.download(args.url, args.savePath, args.fold)
    })
  }
}
</script>
<style lang="scss" scoped>
.download-container {
}
</style>
