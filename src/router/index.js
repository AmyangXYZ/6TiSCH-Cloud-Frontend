import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/pages/Dashboard'
import Scheduler from '@/pages/Scheduler'
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
            path: '/scheduler',
            component: Scheduler,
        },
        {
            path: '/analysis',
            component: Analysis,
        },
    ]
})