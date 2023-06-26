<template>
  <div id="app">
    <keep-alive>
      <router-view />
    </keep-alive>
    <!-- <upload></upload> -->
  </div>
</template>

<script>
// import Upload from '@/views/Update.vue'

export default {
  components: {
    // Upload
  },
  props: {},
  data() {
    return {}
  },
  computed: {},
  methods: {}
}
</script>

<style lang="scss">
html,
body,
div,
section {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
</style>
