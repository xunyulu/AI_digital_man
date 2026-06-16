/**
 * Vue 3 管理后台主应用
 */
// 路由配置
const routes = [
  { path: '/', name: 'dashboard', component: DashboardPage, meta: { title: '数据大屏', icon: 'DataAnalysis' } },
  { path: '/scenicspots', name: 'scenicspots', component: ScenicSpotsPage, meta: { title: '景区管理', icon: 'OfficeBuilding' } },
  { path: '/attractions', name: 'attractions', component: AttractionsPage, meta: { title: '景点管理', icon: 'Location' } },
  { path: '/knowledge', name: 'knowledge', component: KnowledgePage, meta: { title: '知识库', icon: 'Document' } },
  { path: '/routes', name: 'routes', component: RoutesPage, meta: { title: '路线管理', icon: 'Guide' } },
  { path: '/config', name: 'config', component: ConfigPage, meta: { title: '数字人配置', icon: 'Setting' } },
  { path: '/reports', name: 'reports', component: ReportsPage, meta: { title: '数据报告', icon: 'DataLine' } },
  { path: '/system', name: 'system', component: SystemPage, meta: { title: '系统设置', icon: 'Tools' } }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
})

// 主应用组件
const AppLayout = {
  template: `
  <el-container style="height:100vh">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-sidebar">
      <div class="sidebar-header">
        <span v-if="!isCollapse" class="sidebar-title">🤖 AI导游后台</span>
        <span v-else class="sidebar-title">🤖</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#1a3324"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#fff"
        router
        style="border-right:none"
      >
        <el-menu-item v-for="r in routes" :key="r.path" :index="r.path">
          <el-icon><component :is="r.meta.icon"></component></el-icon>
          <span>{{ r.meta.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-button :icon="isCollapse ? 'Expand' : 'Fold'" text @click="isCollapse = !isCollapse"></el-button>
          <span class="header-title">{{ currentTitle }}</span>
        </div>
        <div class="header-center">
          <el-select
            v-model="currentId"
            @change="onSwitchScenic"
            placeholder="选择景区"
            size="default"
            style="width:220px"
            :loading="loadingSpots"
          >
            <el-option v-for="s in store.scenicSpots" :key="s.id" :label="s.name" :value="s.id">
              <span>{{ s.name }}</span>
              <span style="float:right;color:#999;font-size:12px">{{ s.locationCity || '' }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="header-right">
          <span class="header-user">{{ store.user.username }}</span>
          <el-tag size="small" type="success">{{ store.user.role }}</el-tag>
          <el-button text type="danger" @click="handleLogout" style="margin-left:12px">退出</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view :key="$route.path + '-' + currentId"></router-view>
      </el-main>
    </el-container>
  </el-container>
  `,
  provide() {
    return { store: store }
  },
  data() {
    return {
      isCollapse: false,
      loadingSpots: false,
      routes: routes,
      currentId: store.currentScenicId,
      store: store
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path
    },
    currentTitle() {
      const route = routes.find(r => r.path === this.$route.path)
      return route ? route.meta.title : ''
    }
  },
  async created() {
    this.loadingSpots = true
    await store.loadScenicSpots()
    // 从后端同步当前活跃景区（处理多端或刷新场景）
    try {
      const res = await api.get('/api/admin/config/active-scenic-spot')
      if (res.data && res.data.scenicSpotId && res.data.scenicSpotId > 0) {
        store.setCurrentScenicId(res.data.scenicSpotId)
      }
    } catch(e) { /* ignore */ }
    this.currentId = store.currentScenicId
    this.loadingSpots = false
  },
  methods: {
    async onSwitchScenic(id) {
      store.setCurrentScenicId(id)
      this.currentId = store.currentScenicId
      // 同步到后端，让游客端数字人知识库跟着切换
      try {
        await api.put('/api/admin/config/active-scenic-spot', { scenicSpotId: id })
        ElementPlus.ElMessage.success('已切换到「' + store.getCurrentScenic().name + '」，数字人已同步')
      } catch(e) {
        ElementPlus.ElMessage.error('切换失败: ' + e.message)
      }
    },
    handleLogout() {
      store.logout()
    }
  }
}

// 创建Vue应用
const app = Vue.createApp({
  render() { return Vue.h(AppLayout) }
})

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')
