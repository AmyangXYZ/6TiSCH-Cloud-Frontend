import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/pages/Dashboard'
import Analysis from '@/pages/Analysis'
import Schedule from '@/pages/Schedule'
import Disturbance from '@/pages/Disturbance'

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
            path: '/disturbance',
            component: Disturbance,
        },
        {
            path: '/analysis',
            component: Analysis,
        },
    ]
})