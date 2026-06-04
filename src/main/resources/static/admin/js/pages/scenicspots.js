/**
 * 景区管理页面
 */
const ScenicSpotsPage = {
  template: `
  <div class="page-container">
    <div class="page-toolbar">
      <span style="font-size:15px;color:#666">管理所有景区，切换后景点/知识库/路线将自动过滤</span>
      <el-button type="primary" @click="showForm()" style="margin-left:auto">+ 新增景区</el-button>
    </div>

    <div v-loading="loading" style="background:#fff;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f7fa;color:#909399;font-weight:600;font-size:14px">
          <th style="padding:12px 8px;text-align:left;width:60px">ID</th>
          <th style="padding:12px 8px;text-align:left;width:180px">名称</th>
          <th style="padding:12px 8px;text-align:left;width:100px">分类</th>
          <th style="padding:12px 8px;text-align:left;width:100px">城市</th>
          <th style="padding:12px 8px;text-align:left">地址</th>
          <th style="padding:12px 8px;text-align:left;width:120px">门票</th>
          <th style="padding:12px 8px;text-align:left;width:200px">操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in list" :key="r.id" style="border-bottom:1px solid #ebeef5">
            <td style="padding:10px 8px">{{ r.id }}</td>
            <td style="padding:10px 8px">{{ r.name }}</td>
            <td style="padding:10px 8px">{{ r.category || '-' }}</td>
            <td style="padding:10px 8px">{{ r.locationCity || '-' }}</td>
            <td style="padding:10px 8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.address || '-' }}</td>
            <td style="padding:10px 8px">{{ r.ticketPrice || '-' }}</td>
            <td style="padding:10px 8px;white-space:nowrap">
              <button @click="switchTo(r)" :disabled="r.id === currentScenicId" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #2e8b57;background:#2e8b57;color:#fff;border-radius:4px;cursor:pointer" :style="r.id === currentScenicId ? {opacity:0.5,cursor:'not-allowed'} : {}">{{ r.id === currentScenicId ? '当前' : '切换' }}</button>
              <button @click="editForm(r)" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #dcdfe6;background:#fff;color:#606266;border-radius:4px;cursor:pointer">编辑</button>
              <button @click="delItem(r)" style="padding:5px 12px;font-size:12px;border:1px solid #e74c3c;background:#e74c3c;color:#fff;border-radius:4px;cursor:pointer">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑景区' : '新增景区'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name"></el-input></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="如：自然风光、人文历史..."></el-input></el-form-item>
        <el-form-item label="城市"><el-input v-model="form.locationCity"></el-input></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address"></el-input></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3"></el-input></el-form-item>
        <el-form-item label="门票价格"><el-input v-model="form.ticketPrice" placeholder="如：¥120"></el-input></el-form-item>
        <el-form-item label="开放时间"><el-input v-model="form.openTime" placeholder="如：08:00-17:30"></el-input></el-form-item>
        <el-form-item label="最佳季节"><el-input v-model="form.bestSeason"></el-input></el-form-item>
        <el-form-item label="建议时长"><el-input v-model="form.suggestedDuration" placeholder="如：3-4小时"></el-input></el-form-item>
        <el-form-item label="交通指南"><el-input v-model="form.transportInfo" type="textarea" :rows="2"></el-input></el-form-item>
        <el-form-item label="贴士"><el-input v-model="form.tips" type="textarea" :rows="2"></el-input></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
  `,
  data() {
    return {
      loading: false, saving: false,
      list: [],
      dialogVisible: false, isEdit: false,
      form: { id: null, name: '', category: '', locationCity: '', address: '', description: '',
              ticketPrice: '', openTime: '', bestSeason: '', suggestedDuration: '', transportInfo: '', tips: '' }
    }
  },
  inject: ['store'],
  async mounted() { await this.loadData() },
  computed: {
    currentScenicId() { return store.currentScenicId }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const res = await api.get('/api/admin/scenic-spots')
        if (res.data) this.list = res.data
      } catch(e) { ElementPlus.ElMessage.error('加载景区列表失败') }
      this.loading = false
    },
    switchTo(row) {
      store.setCurrentScenicId(row.id)
      store.loadScenicSpots()
      ElementPlus.ElMessage.success('已切换到「' + row.name + '」')
    },
    showForm() {
      this.isEdit = false
      this.form = { id: null, name: '', category: '', locationCity: '', address: '', description: '',
                    ticketPrice: '', openTime: '', bestSeason: '', suggestedDuration: '', transportInfo: '', tips: '' }
      this.dialogVisible = true
    },
    editForm(row) {
      this.isEdit = true
      Object.assign(this.form, {
        id: row.id, name: row.name || '', category: row.category || '',
        locationCity: row.locationCity || '', address: row.address || '',
        description: row.description || '', ticketPrice: row.ticketPrice || '',
        openTime: row.openTime || '', bestSeason: row.bestSeason || '',
        suggestedDuration: row.suggestedDuration || '', transportInfo: row.transportInfo || '', tips: row.tips || ''
      })
      this.dialogVisible = true
    },
    async saveItem() {
      this.saving = true
      try {
        if (this.isEdit) {
          await api.put('/api/admin/scenic-spots/' + this.form.id, this.form)
          ElementPlus.ElMessage.success('景区已更新')
        } else {
          await api.post('/api/admin/scenic-spots', this.form)
          ElementPlus.ElMessage.success('景区已创建')
        }
        this.dialogVisible = false
        await this.loadData()
        await store.loadScenicSpots()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    },
    async delItem(row) {
      if (this.list.length <= 1) {
        ElementPlus.ElMessage.warning('至少保留一个景区')
        return
      }
      try {
        await ElementPlus.ElMessageBox.confirm('确认删除景区「' + row.name + '」？关联的景点/知识/路线也将被删除。', '确认删除', { type: 'warning' })
        await api.del('/api/admin/scenic-spots/' + row.id)
        ElementPlus.ElMessage.success('已删除')
        if (store.currentScenicId === row.id) {
          store.setCurrentScenicId(this.list[0]?.id === row.id ? (this.list[1]?.id || 1) : this.list[0]?.id || 1)
        }
        await this.loadData()
        await store.loadScenicSpots()
      } catch(e) { if (e !== 'cancel') ElementPlus.ElMessage.error(e.message) }
    }
  }
}
