<template>
  <svg class="icon"
       aria-hidden="true">
    <use v-bind:xlink:href="iconType"></use>
  </svg>
</template>

<script>
export default {
  name: 'x_icon',
  props: {
    /******************************
    ** 图标组件
    * @description codesign symbol图标组件
    * @author stone
    * ************************************
    type           iconfont图标类型
    *******************************/
    type: {
      type: String,
      required: true
    }
  },
  computed: {
    iconType () {
      return `#icon-${this.type}`
    }
  }
}
</script>

<style lang="scss" scoped>
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
