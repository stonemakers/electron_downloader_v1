import axios from 'axios'

const serves = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    ContentType: 'application/json',
    AccessControlAllowOrigin: '*'
  }
})

// 设置请求发送之前的拦截器
serves.interceptors.request.use(
  config => {
    // 设置发送之前将token数据放入头部信息中
    const token = localStorage.getItem('x_token')
    if (token) {
      config.headers.Authorization = token // 将token放到请求头发送给服务器
      return config
    } else {
      return config
    }
  },
  err => Promise.reject(err)
)

// 设置请求接受拦截器
serves.interceptors.response.use(
  res => {
    // 设置接受数据之后，做什么处理
    return Promise.resolve(res)
  },
  err => {
  }
)

// 将serves抛出去
export default serves
