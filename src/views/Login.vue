<template>
  <section class="login-container">
    <section class="cover">
      <img src="logo.png"
           alt="">
    </section>

    <section class="input-wrapper">
      <section class="qh">+86</section>
      <input type="text"
             placeholder="手机号"
             v-model="phoneNo"
             class="phone" />
      <!-- 获取验证码 -->
      <div class="getcode"
           v-if="!sendStatus"
           @click="getCode">获取验证码</div>
      <div class="getcode"
           v-else>{{ time }}s</div>
    </section>

    <section class="input-wrapper">
      <input type="text"
             v-model="code"
             placeholder="验证码"
             class="code" />
    </section>

    <section class="btn login"
             :class="{ disabled: disabledBtn }"
             @click="login">{{ disabledBtn ? '登录中...' : '登录' }}</section>
  </section>
</template>
<script>
import api from '@/Api'
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
    return {
      countryCode: '86',
      phoneNo: '',
      time: 60,
      interval: '',
      code: '',
      sendStatus: false,
      disabledBtn: false
    }
  },
  computed: {},
  methods: {
    login () {
      this.disabledBtn = true
      if (this.code !== '' && this.phoneNo !== '') {
        if (this.disabledBtn) {
          api.login(
            {
              client_id: 'web',
              grant_type: 'sms',
              countryCode: '86',
              phoneNo: this.phoneNo,
              code: this.code
            },
            res => {
              if (res.status === 200) {
                // 登陆成功
                const token = `${res.data.token_type} ${res.data.access_token}`
                localStorage.setItem('x_token', token)
                localStorage.setItem('x_refresh_token', res.data.refresh_token)
                // 获取当前用户信息，保存到vuex中，跳转到index
                api.getUserInfo(
                  res => {
                    const userInfo = {
                      id: res.data.id,
                      avatar: res.data.avatar,
                      nickname: res.data.nickname ? res.data.nickname : '默认用户',
                      countryCode: res.data.account.countryCode,
                      phoneNo: res.data.account.phoneNo
                    }
                    this.$store.commit('SET_USER_INFO', userInfo)
                    this.$router.replace({
                      path: '/'
                    })
                  },
                  err => {
                    alert(err)
                  }
                )
              }
            },
            err => {
              alert(err)
            }
          )
        }
      } else {
        alert('填写信息有误')
        this.disabledBtn = false
      }
    },
    checkData () {
      if (this.phoneNo.length !== 11) {
        alert('手机号输入有误')
        this.phoneNo = ''
        this.$refs.phoneNo.focus()
        return false
      } else {
        return true
      }
    },
    getCode () {
      if (this.checkData()) {
        this.sendStatus = true
        api.getVerifyCode(
          {
            countryCode: this.countryCode,
            phoneNo: this.phoneNo
          },
          res => {
            // 发送成功开始倒数
            this.doTimer()
          },
          err => {
            alert(err)
            window.clearInterval(this.interval)
            this.sendStatus = false
            this.time = 60
            this.disabledBtn = false
          }
        )
      }
    },
    // 验证码计时
    doTimer () {
      this.interval = setInterval(() => {
        if (this.time > 1) {
          this.time--
        } else {
          window.clearInterval(this.interval)
          this.sendStatus = false
          this.time = 60
        }
      }, 1000)
    }
  },
  created () {
    document.onkeydown = e => {
      e = window.event || e
      const key = e.keyCode
      if (key === 13) {
        this.login()
      }
    }
  },
  destroyed () {
    this.disabledBtn = true
  }
}
</script>
<style lang="scss" scoped>
.login-container {
  padding: 0 20px;
  box-sizing: border-box;
  .cover {
    width: 100%;
    height: 300px;
    // background: blue;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
      width: 100px;
    }
  }

  .input-wrapper {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 50px;
    border-bottom: 1px solid rgb(241, 241, 241);
    font-size: 14px;
    color: rgb(124, 124, 124);
    margin-top: 10px;

    .qh {
      padding: 0 10px;
    }

    input {
      border: 0;
      // background: red;
      height: 50px;
      padding: 0 10px;
      box-sizing: border-box;
      flex: 1;
      width: 100px;
      letter-spacing: 1px;
      font-size: 18px;
      outline: none;
      background: transparent;
    }

    input::-webkit-input-placeholder,
    textarea::-webkit-input-placeholder {
      color: #666;
      font-size: 14px;
      letter-spacing: 0px;
    }
  }
  .getcode {
    color: #000;

    &:hover {
      cursor: pointer;
      color: #333;
    }
  }
  .btn {
    color: #fff;
    font-size: 16px;
    letter-spacing: 1px;
    background: #000;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 17px;
    margin-top: 20px;
    font-weight: 900;
    &:hover {
      cursor: pointer;
      background: #333;
    }
  }
}
</style>
