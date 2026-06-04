/**
 * 数据报告页面
 */
const ReportsPage = {
  template: `
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><div class="card-header"><span>评分分布</span></div></template>
          <el-table :data="scoreDist" border stripe v-loading="loading">
            <el-table-column prop="score" label="评分" width="100"></el-table-column>
            <el-table-column prop="count" label="数量"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><div class="card-header"><span>近期对话</span></div></template>
          <div v-if="recentQueries.length === 0 && !loading" style="color:#999;text-align:center;padding:40px">暂无数据</div>
          <div v-for="q in recentQueries" :key="q.id" class="query-item">
            <div class="query-user">👤 游客{{ q.touristId || '匿名' }}</div>
            <div class="query-text">{{ q.content }}</div>
            <div class="query-time">{{ q.createdAt }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  `,
  data() {
    return {
      loading: false,
      scoreDist: [],
      recentQueries: []
    }
  },
  computed: {
    scenicId() { return store.currentScenicId }
  },
  inject: ['store'],
  async mounted() { await this.loadData() },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 加载评分统计
        const res1 = await api.get('/api/admin/ratings/stats', { scenicSpotId: this.scenicId })
        if (res1.data && res1.data.distribution) {
          this.scoreDist = Object.entries(res1.data.distribution).map(([score, count]) => ({
            score: score + '分', count
          }))
        }
      } catch(e) { console.error('加载报告失败', e) }
      // 加载近期对话
      try {
        const res2 = await api.get('/api/admin/conversations', { limit: 10, scenicSpotId: this.scenicId })
        if (res2.data && res2.data.list) {
          this.recentQueries = res2.data.list.slice(0, 10)
        } else if (res2.data && res2.data.content) {
          // Spring Data Page returns content
          this.recentQueries = (res2.data.content || []).slice(0, 10)
        }
      } catch(e) {}
      this.loading = false
    }
  }
}
