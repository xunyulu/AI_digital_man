/**
 * 简单全局状态管理（基于Vue reactive）
 */
const store = window.store = Vue.reactive({
  user: {
    username: localStorage.getItem('admin_user') || '管理员',
    role: localStorage.getItem('admin_role') || 'ADMIN'
  },
  scenicSpots: [],       // 景区列表
  currentScenicId: parseInt(localStorage.getItem('currentScenicId') || '1'),

  setUser(username, role) {
    this.user.username = username
    this.user.role = role
    localStorage.setItem('admin_user', username)
    localStorage.setItem('admin_role', role)
  },

  setCurrentScenicId(id) {
    this.currentScenicId = id
    localStorage.setItem('currentScenicId', String(id))
  },

  async loadScenicSpots() {
    try {
      const res = await api.get('/api/admin/scenic-spots')
      if (res.data) {
        this.scenicSpots = res.data
        // 如果当前选中的景区不在列表中，选第一个
        if (this.scenicSpots.length > 0 && !this.scenicSpots.find(s => s.id === this.currentScenicId)) {
          this.setCurrentScenicId(this.scenicSpots[0].id)
        }
      }
    } catch(e) { console.error('加载景区列表失败', e) }
  },

  getCurrentScenic() {
    return this.scenicSpots.find(s => s.id === this.currentScenicId) || { name: '未知景区' }
  },

  logout() {
    api.post('/api/admin/logout').catch(() => {})
    localStorage.clear()
    location.href = 'login.html'
  }
})
