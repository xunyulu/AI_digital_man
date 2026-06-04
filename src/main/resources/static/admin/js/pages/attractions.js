/**
 * 景点管理页面
 */
const AttractionsPage = {
  template: `
  <div class="page-container">
    <div class="page-toolbar">
      <span style="color:#666">当前景区：<strong>{{ store.getCurrentScenic().name }}</strong></span>
      <el-input v-model="search" placeholder="搜索景点名称" clearable style="width:200px;margin-left:12px"></el-input>
      <el-button type="primary" @click="showForm()" style="margin-left:auto">+ 新增景点</el-button>
    </div>

    <div v-loading="loading" style="background:#fff;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f7fa;color:#909399;font-weight:600;font-size:14px">
          <th style="padding:12px 8px;text-align:left;width:60px">ID</th>
          <th style="padding:12px 8px;text-align:left;width:160px">名称</th>
          <th style="padding:12px 8px;text-align:left">描述</th>
          <th style="padding:12px 8px;text-align:left;width:160px">坐标</th>
          <th style="padding:12px 8px;text-align:left;width:70px">排序</th>
          <th style="padding:12px 8px;text-align:left;width:150px">操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in filteredList" :key="r.id" style="border-bottom:1px solid #ebeef5">
            <td style="padding:10px 8px">{{ r.id }}</td>
            <td style="padding:10px 8px">{{ r.name }}</td>
            <td style="padding:10px 8px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.description || '-' }}</td>
            <td style="padding:10px 8px;font-size:12px">{{ r.latitude?.toFixed(4) }}, {{ r.longitude?.toFixed(4) }}</td>
            <td style="padding:10px 8px">{{ r.sortOrder }}</td>
            <td style="padding:10px 8px;white-space:nowrap">
              <button @click="editForm(r)" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #dcdfe6;background:#fff;color:#606266;border-radius:4px;cursor:pointer">编辑</button>
              <button @click="delItem(r)" style="padding:5px 12px;font-size:12px;border:1px solid #e74c3c;background:#e74c3c;color:#fff;border-radius:4px;cursor:pointer">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑景点' : '新增景点'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name"></el-input></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3"></el-input></el-form-item>
        <el-form-item label="纬度"><el-input v-model="form.latitude"></el-input></el-form-item>
        <el-form-item label="经度"><el-input v-model="form.longitude"></el-input></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="1" :max="999"></el-input-number></el-form-item>
        <el-form-item label="开放时间"><el-input v-model="form.openTime" placeholder="如 08:00-17:00"></el-input></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.imageUrl" placeholder="景点图片链接"></el-input></el-form-item>
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
      search: '', loading: false, saving: false,
      list: [],
      dialogVisible: false, isEdit: false,
      form: { id: null, name: '', description: '', latitude: '', longitude: '', sortOrder: 99, openTime: '', imageUrl: '' }
    }
  },
  computed: {
    scenicId() { return store.currentScenicId },
    filteredList() {
      if (!this.search) return this.list
      const kw = this.search.toLowerCase()
      return this.list.filter(a => a.name && a.name.toLowerCase().includes(kw))
    }
  },
  inject: ['store'],
  mounted() { this.loadData() },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const res = await api.get('/api/admin/attractions', { scenicSpotId: this.scenicId })
        if (res.data) this.list = res.data
      } catch(e) { ElementPlus.ElMessage.error('加载景点列表失败') }
      this.loading = false
    },
    showForm() {
      this.isEdit = false
      this.form = { id: null, name: '', description: '', latitude: '', longitude: '', sortOrder: 99, openTime: '', imageUrl: '' }
      this.dialogVisible = true
    },
    editForm(row) {
      this.isEdit = true
      this.form = {
        id: row.id, name: row.name, description: row.description || '',
        latitude: row.latitude ?? '', longitude: row.longitude ?? '',
        sortOrder: row.sortOrder ?? 99, openTime: row.openTime || '', imageUrl: row.imageUrl || ''
      }
      this.dialogVisible = true
    },
    async saveItem() {
      this.saving = true
      try {
        const body = {
          name: this.form.name, description: this.form.description,
          latitude: parseFloat(this.form.latitude) || 0,
          longitude: parseFloat(this.form.longitude) || 0,
          sortOrder: this.form.sortOrder, openTime: this.form.openTime,
          imageUrl: this.form.imageUrl,
          scenicSpot: { id: this.scenicId }
        }
        if (this.isEdit) {
          await api.put('/api/admin/attractions/' + this.form.id, body)
          ElementPlus.ElMessage.success('景点已更新')
        } else {
          await api.post('/api/admin/attractions', body)
          ElementPlus.ElMessage.success('景点已创建')
        }
        this.dialogVisible = false
        await this.loadData()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    },
    async delItem(row) {
      try {
        await ElementPlus.ElMessageBox.confirm('确认删除景点「' + row.name + '」？', '确认删除', { type: 'warning' })
        await api.del('/api/admin/attractions/' + row.id)
        ElementPlus.ElMessage.success('已删除')
        await this.loadData()
      } catch(e) { if (e !== 'cancel') ElementPlus.ElMessage.error(e.message) }
    }
  }
}
