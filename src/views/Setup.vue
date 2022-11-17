<template>
  <section class="setup-container">
    <h1 @click="back" class="back">返回</h1>
    <p class="name grey">下载路径：</p>
     <section class="save-path">
        
        <span class="content"><input readonly
                 type="text"
                 :value="downloadFold"></span>
        <section class="choose"
                 @click="choosePath">浏览</section>
      </section>

      <section class="foot">
        LightIO {{ $version }}
      </section>
  </section>
</template>
<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'setup_page',
  components: {},
  props: {},
  data () {
    return {
      downloadFold: ''
    }
  },
  computed: {},
  methods: {
    back(){
      this.$router.go(-1)
    },
    choosePath () {
      if (ipcRenderer) {
        ipcRenderer.send('choosePath')
      }
    },
  },
  mounted(){
    this.downloadFold = this.$estore.get('downloadFold')
    ipcRenderer.on('setDownloadFolder', (event, arg) => {
      console.log('监听到了路径：', arg)
      this.$estore.set('downloadFold', arg)
      this.downloadFold = arg
    })
  }
}
</script>
<style lang="scss" scoped>
.setup-container{
  padding: 20px;
  box-sizing: border-box;
  font-size: 14px;

  .foot{
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: rgb(190, 190, 190);
    position: fixed;
    bottom:20px;
    left: 0;
  }

  .back{
    &:hover{
      cursor: pointer;
    }
  }

  .save-path{
    display: flex;
    width: 100%;
    justify-content: flex-start;
    .content{
      flex: 2;
      height: 30px;
      padding-right: 10px;
      box-sizing: border-box;
      input{
        width: 100%;
        display: flex;
        height: 25px;
        flex: 1;
      }
    }

    .choose{
      color: #fff;
      background: #000;
      border-radius: 2px;
      flex: 1;
      height: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      &:hover{
        cursor: pointer;

      }
    }
  }
}
</style>
