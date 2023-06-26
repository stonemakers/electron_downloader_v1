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
        appId: 'cc.lightio.lightioCloudDiskDownloader',
        mac: {
          icon: './public/icon/app.png',
          artifactName: "${productName}-${version}.${ext}"
        },
        win: {
          icon: './public/icon/app.ico',
          artifactName: "${productName}-${version}.${ext}"
        },
        productName: 'LightIO'
      }
    }
  }
}
