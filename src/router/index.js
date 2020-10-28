import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/pages/Dashboard'
import Schedule from '@/pages/Schedule'
import Analysis from '@/pages/Analysis'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/dashboard',
        },
        {
            path: '/dashboard',
            component: Dashboard,
        },
        {
            path: '/schedule',
            component: Schedule,
        },
        {
            path: '/analysis',
            component: Analysis,
        },
    ]
})