<template>
  <section class="bar-container" style="-webkit-app-region: drag">
    <section class="left">
      <img src="logo.png"
           alt="">
    </section>
    <section class="right">
      15%
    </section>
  </section>
</template>
<script>
export default {
  /******************************************
  ** 组件名称
  * @description 组件描述
  * @author name
  *****************************************
  prop1          <type>            <属性描述>
  *****************************************/
  name: 'component_name',
  components: {},
  props: {},
  data () {
    return {}
  },
  computed: {},
  methods: {}
}
</script>
<style lang="scss" scoped>
.bar-container{
  background: #fff;
  height: 100vh;
  width: 100%;
  font-size: 12px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 0 0 15px;
  box-sizing: border-box;
  
  .left{
    display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
    img{
      height: 60%;
    }

  }

  .right{
    color: #000;
    font-size: 14px;
    font-weight: 900;
    height: 100%;
    width: 100%;
    display: flex;
  justify-content: center;
  align-items: center;
  }

  
}
</style>
