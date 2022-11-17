/******************************************************
 * 云影像 - SAAS云盘
 * api文档地址：https://www.kancloud.cn/yaopai2018/cloudstorage/2274718
 * author: stone
 * ****************************************************
 */
import request from '@/utils/request.js'
import qs from 'qs'
import Store from 'electron-store'

let DOMAIN
let store = new Store()
let env

function getEnv(){
  env = store.get('env') || 'pro'
  if(env === 'dev'){
    DOMAIN = 'https://api-sta.devops.back.aiyaopai.com'
  }else{
    DOMAIN = 'https://saas.api.lightio.cc'
  }
} 

export default {
  // 获取短信验证码
  getVerifyCode: (req, suc, err) => {
    getEnv()
    request
      .post(
        DOMAIN + '/oauth/smsconnect/code',
        qs.stringify({
          countryCode: req.countryCode,
          phoneNo: req.phoneNo
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )
      .then(response => suc(response))
      .catch(error => err(error))
  },

  // 获取照片列表
  
  
  // 登录
  login: (req, suc, err) => {
    getEnv()
    request
      .post(
        DOMAIN + '/oauth/connect/token',
        qs.stringify({
          client_id: req.client_id,
          grant_type: req.grant_type,
          countryCode: req.countryCode,
          phoneNo: req.phoneNo,
          code: req.code
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )
      .then(response => suc(response))
      .catch(error => err(error))
  },

  // 获取分享信息
  getShareInfo: foldId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/storagesharing/view/' + foldId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 验证分享信息
  verifySharePassword: (id, ps) => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/storagesharing/view/state?id=' + id+'&password='+ps,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取文件夹
  getFold: (id, ps) => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/storagesharing/view/expand?id=' + id+'&password='+ps,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取子文件夹内容
  getChildFold: (params) => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/storagesharing/view/expand/list',
        method: 'get',
        params: params
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },


  // 获取用户信息
  getUserInfo: (suc, err) => {
    getEnv()
    request
      .get(DOMAIN + '/user/current', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => suc(response))
      .catch(error => err(error))
  },


  // 刷新登录token
  refreshToken: (token, suc, err) => {
    getEnv()
    request 
      .post(
        DOMAIN + '/oauth/connect/token',
        qs.stringify({
          client_id: 'web',
          grant_type: 'refresh_token',
          refresh_token: token
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )
      .then(response => suc(response))
      .catch(error => err(error))
  },

  // 获取下级文件夹和文件
  getStructure: params => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/directory/multiple',
        method: 'get',
        params
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取指定直播ID的相册信息
  getAlbumById: liveId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/livealbum/' + liveId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取指定云相册ID的相册信息
  getCloudAlbumById: liveId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/cloudalbum/' + liveId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取原图分类列表
  getOriginCategory: liveId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/originalpicturecategory/list?albumId=' + liveId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取云相册相册分类列表
  getCloudAlbumCategory: liveId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/cloudalbumpicturecategory/list?albumId=' + liveId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取发布图分类列表
  getPublishCategory: liveId => {
    getEnv()
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/livepicturecategory/list?albumId=' + liveId,
        method: 'get'
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取指定云相册ID的原片列表
  getCloudAlbumPhotoList: params => {
    getEnv()
    // `/livepicture/list?offset=${params.offset}&limit=${params.limit}&albumId=${params.id}&key=${params.key}&categoryId=${params.categoryId}&createdUserId=${params.createdUserId}&originalUserId=${params.originalUserId}&hidden=${params.hidden}&sortOrder=${params.sortOrder}`
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/cloudalbumpicture/list',
        method: 'get',
        params
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取指定直播ID的原片列表
  getOriginAlbumPhotoList: params => {
    getEnv()
    // `/livepicture/list?offset=${params.offset}&limit=${params.limit}&albumId=${params.id}&key=${params.key}&categoryId=${params.categoryId}&createdUserId=${params.createdUserId}&originalUserId=${params.originalUserId}&hidden=${params.hidden}&sortOrder=${params.sortOrder}`
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/originalpicture/list',
        method: 'get',
        params
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },

  // 获取指定直播ID的发布图片列表
  getPublishAlbumPhotoList: params => {
    getEnv()
    // `/livepicture/list?offset=${params.offset}&limit=${params.limit}&albumId=${params.id}&key=${params.key}&categoryId=${params.categoryId}&createdUserId=${params.createdUserId}&originalUserId=${params.originalUserId}&hidden=${params.hidden}&sortOrder=${params.sortOrder}`
    return new Promise((resolve, reject) => {
      request({
        url: DOMAIN + '/livepicture/list',
        method: 'get',
        params
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  }
}
