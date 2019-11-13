import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/pages/Dashboard'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/dashboard',
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: Dashboard,
        },
        {
            path: '/analysis',
            name: 'analysis',
        }
    ]
})