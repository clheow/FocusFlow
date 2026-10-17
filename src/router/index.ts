import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/tabs/home',
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue'),
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', component: () => import('@/views/HomePage.vue') },
      { path: 'tasks', component: () => import('@/views/TasksPage.vue') },
      { path: 'tasks/new', component: () => import('@/views/TaskDetailPage.vue') },
      { path: 'tasks/:id', component: () => import('@/views/TaskDetailPage.vue') },
      { path: 'pomodoro', component: () => import('@/views/PomodoroPage.vue') },
      { path: 'statistics', component: () => import('@/views/StatisticsPage.vue') },
      { path: 'profile', component: () => import('@/views/ProfilePage.vue') },
      { path: 'ai-planner', component: () => import('@/views/AIPlannerPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const isAuthRoute = to.path === '/login' || to.path === '/register';
  const token = localStorage.getItem('focusflow_token');

  if (!token && !isAuthRoute) {
    return '/login';
  }
  if (token && isAuthRoute) {
    return '/tabs/home';
  }
  return true;
});

export default router;