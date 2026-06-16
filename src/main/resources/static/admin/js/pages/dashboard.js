/**
 * Dashboard - 数据大屏
 */
const DashboardPage = {
  template: `
  <div class="dashboard">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:#e8f5e9">💬</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalConversations }}</div>
          <div class="stat-label">总对话数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#e3f2fd">🟢</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.activeConversations }}</div>
          <div class="stat-label">活跃对话</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fff3e0">👥</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalTourists }}</div>
          <div class="stat-label">游客总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fce4ec">⭐</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.averageScore }}</div>
          <div class="stat-label">平均评分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#e8f5e9">🏔️</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalScenicSpots }}</div>
          <div class="stat-label">景区数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f3e5f5">📝</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalRatings }}</div>
          <div class="stat-label">评价总数</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">评分分布</div>
        <div id="scoreChart" style="width:100%;height:350px"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">近7天对话趋势</div>
        <div id="trendChart" style="width:100%;height:350px"></div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      stats: { totalConversations: 0, activeConversations: 0, totalTourists: 0,
               averageScore: 0, totalScenicSpots: 0, totalRatings: 0 },
      scoreChart: null,
      trendChart: null
    }
  },
  inject: ['store'],
  async mounted() {
    await this.loadStats()
    this.$nextTick(() => { this.initCharts() })
  },
  computed: {
    scenicId() { return store.currentScenicId }
  },
  methods: {
    async loadStats() {
      try {
        const res = await api.get('/api/admin/dashboard/stats', { scenicSpotId: this.scenicId })
        if (res.data) this.stats = res.data
      } catch(e) { console.error('加载统计数据失败', e) }
    },
    initCharts() {
      // 评分分布饼图
      const scoreDom = document.getElementById('scoreChart')
      if (scoreDom) {
        this.scoreChart = echarts.init(scoreDom)
        this.loadScoreChart()
      }
      // 趋势图（暂用静态数据演示）
      const trendDom = document.getElementById('trendChart')
      if (trendDom) {
        this.trendChart = echarts.init(trendDom)
        this.trendChart.setOption({
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: ['周一','周二','周三','周四','周五','周六','周日'] },
          yAxis: { type: 'value' },
          series: [{
            data: [12, 18, 15, 22, 19, 28, 25],
            type: 'line',
            smooth: true,
            areaStyle: { color: 'rgba(46,139,87,0.2)' },
            itemStyle: { color: '#2e8b57' }
          }]
        })
      }
    },
    async loadScoreChart() {
      try {
        const res = await api.get('/api/admin/ratings/stats', { scenicSpotId: this.scenicId })
        if (res.data && res.data.distribution && this.scoreChart) {
          const dist = res.data.distribution
          this.scoreChart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}条 ({d}%)' },
            series: [{
              type: 'pie', radius: ['45%', '70%'],
              data: Object.entries(dist).map(([k,v]) => ({ name: k+'分', value: v })),
              label: { formatter: '{b}\n{d}%' }
            }]
          })
        }
      } catch(e) {
        // 用模拟数据
        if (this.scoreChart) {
          this.scoreChart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}条' },
            series: [{
              type: 'pie', radius: ['45%', '70%'],
              data: [
                { name: '5分', value: 45 }, { name: '4分', value: 30 },
                { name: '3分', value: 15 }, { name: '2分', value: 6 },
                { name: '1分', value: 4 }
              ]
            }]
          })
        }
      }
    }
  },
  beforeUnmount() {
    if (this.scoreChart) this.scoreChart.dispose()
    if (this.trendChart) this.trendChart.dispose()
  }
}
