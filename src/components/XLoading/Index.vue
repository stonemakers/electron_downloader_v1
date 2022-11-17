<template>
  <section class="x-loading">
    <!-- panel -->
    <section class="panel">
      <div class="loading"></div>
    </section>
  </section>
</template>
<script>
export default {
  name: 'x_loading',
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
.x-loading {
   position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: rgba(0,0,0,.4);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
    .panel{
      width: 30vw;
      height: 30vw;
      background: #fff;
      border-radius: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

  }
  .loading {
    width: 30px;
    height: 30px;
    border: 2px solid rgb(102, 102, 102);
    border-top-color: transparent;
    border-radius: 100%;

    animation: circle infinite 0.75s linear;
  }

  // 转转转动画
  @keyframes circle {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }

</style>
