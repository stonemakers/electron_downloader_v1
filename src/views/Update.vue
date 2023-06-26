<template>
  <section class="update-container" v-if="show">
    <section class="top">
      <x-icon type="upload"></x-icon>
    </section>

    <section class="bottom">
      <h1 class="title">当前版本低</h1>
      <h1 class="title">请下载最新版本使用</h1>

      <p class="info">
        当前版本 {{$version}}  最新版本 {{newVer}}
      </p>

      <section class="download-btn" @click="open">立即下载</section>
    </section>
  </section>
</template>
<script>
const exec = require('child_process').exec
import api from '@/Api.js'
export default {
  /******************************************
  ** 更新组件
  * @description 更新
  * @author name
  *****************************************/
  name: 'upload',
  components: {},
  props: {},
  data () {
    return { 
      newVer: '',
      show: false
    }
  },
  computed: {},
  methods: {
    openDefaultBrowser() {
      let url = `https://assets.aiyaopai.com/downloaderUpdate/LightIO-${this.newVer}`
      switch (process.platform) {
        case "darwin":
          exec('open ' + url+'.dmg');
          break;
        case "win32":
          exec('start ' + url+'.exe');
          break;
        default:
          exec('xdg-open', [url+'.exe']);
      }
    },
    open(){
      this.openDefaultBrowser()
    }
  },
  async mounted(){
    const res = await api.getVersion()
    if(res.data){
    this.newVer = res.data
    if(this.newVer !== this.$version){
      this.show = true
    }else{
      this.show = false
    }
    }else{
      this.show=false
    }
  }
}
</script>
<style lang="scss" scoped>
.update-container{
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: #fff;
  z-index: 9999;

  .top{
    height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;

    .icon{
      font-size: 80px;
    }
  }

  .bottom{
    height: 40vh;
    padding: 0 30px;
    box-sizing: border-box;

    .title{
      line-height: 15px;
      font-size: 22px;
    }

    .info{
      font-size: 12px;
      color: #555;
    }

    .download-btn{
      background: #FFFF33;
      color: #000;
      margin-top: 30px;
      font-size: 16px;
      font-weight: 900;
      height: 45px;
      border-radius: 10px;
      display: flex;
      justify-content: center;
      align-items: center;

      &:active, &:hover{
        cursor: pointer;
        filter: brightness(80%);
      }
    }
  }
}
</style>
