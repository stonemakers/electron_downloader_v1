// const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true
// })

'use strict'
module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'com.aiyaopai.www',
        mac: {
          icon: './public/icon/app.png'
        },
        win: {
          icon: './public/icon/app.ico'
        },
        productName: '邀拍云影像'
      }
    }
  }
}
