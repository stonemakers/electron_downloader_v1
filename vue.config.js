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
        appId: 'cc.lightio.www',
        mac: {
          icon: './public/icon/app.png'
        },
        win: {
          icon: './public/icon/app.ico'
        },
        productName: 'LightIO'
      }
    }
  }
}
