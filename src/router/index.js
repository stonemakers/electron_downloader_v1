import Vue from 'vue'
import VueRouter from 'vue-router'
import Index from '../views/Index.vue'
import Login from '../views/Login.vue'
import Setup from '../views/Setup.vue'
import Task from '../views/Task.vue'
import Download from '../views/Download.vue'
import store from '@/store'
import api from '@/Api'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    component: Index
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/setup',
    name: 'setup',
    component: Setup
  },
  {
    path: '/task',
    name: 'task',
    component: Task
  },
  {
    path: '/download',
    name: 'download',
    component: Download
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})



export default router
