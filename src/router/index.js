import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/pages/Dashboard'
import Todo from '@/pages/Todo'

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
            path: '/analysis',
        },
        {
            path: '/todo',
            component: Todo,
        }
    ]
})