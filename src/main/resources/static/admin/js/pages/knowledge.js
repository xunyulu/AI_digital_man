/**
 * 知识库管理页面
 */
const KnowledgePage = {
  template: `
  <div class="page-container">
    <div class="page-toolbar">
      <span style="color:#666">当前景区：<strong>{{ store.getCurrentScenic().name }}</strong></span>
      <el-input v-model="search" placeholder="搜索标题/标签" clearable style="width:200px;margin-left:12px"></el-input>
      <el-button type="primary" @click="showForm()" style="margin-left:auto">+ 新增知识点</el-button>
    </div>

    <div v-loading="loading" style="background:#fff;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f7fa;color:#909399;font-weight:600;font-size:14px">
          <th style="padding:12px 8px;text-align:left;width:60px">ID</th>
          <th style="padding:12px 8px;text-align:left;width:160px">标题</th>
          <th style="padding:12px 8px;text-align:left;width:100px">分类</th>
          <th style="padding:12px 8px;text-align:left;width:120px">关联景点</th>
          <th style="padding:12px 8px;text-align:left">标签</th>
          <th style="padding:12px 8px;text-align:left">内容</th>
          <th style="padding:12px 8px;text-align:left;width:150px">操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in filteredList" :key="r.id" style="border-bottom:1px solid #ebeef5">
            <td style="padding:10px 8px">{{ r.id }}</td>
            <td style="padding:10px 8px">{{ r.title }}</td>
            <td style="padding:10px 8px">{{ r.category || '-' }}</td>
            <td style="padding:10px 8px">{{ r.attraction?.name || '-' }}</td>
            <td style="padding:10px 8px">{{ r.tags || '-' }}</td>
            <td style="padding:10px 8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.content || '-' }}</td>
            <td style="padding:10px 8px;white-space:nowrap">
              <button @click="editForm(r)" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #dcdfe6;background:#fff;color:#606266;border-radius:4px;cursor:pointer">编辑</button>
              <button @click="delItem(r)" style="padding:5px 12px;font-size:12px;border:1px solid #e74c3c;background:#e74c3c;color:#fff;border-radius:4px;cursor:pointer">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑知识点' : '新增知识点'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title"></el-input></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5"></el-input></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="如：历史沿革、建筑景观..."></el-input></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tags" placeholder="逗号分隔多个标签"></el-input></el-form-item>
        <el-form-item label="关联景点">
          <el-select v-model="form.attractionId" placeholder="选择关联景点" clearable style="width:100%">
            <el-option v-for="a in attractions" :key="a.id" :label="a.name" :value="a.id"></el-option>
          </el-select>
        </el-form-item>
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
      list: [], attractions: [],
      dialogVisible: false, isEdit: false,
      form: { id: null, title: '', content: '', category: '', tags: '', attractionId: null }
    }
  },
  computed: {
    scenicId() { return store.currentScenicId },
    filteredList() {
      if (!this.search) return this.list
      const kw = this.search.toLowerCase()
      return this.list.filter(k =>
        (k.title && k.title.toLowerCase().includes(kw)) ||
        (k.tags && k.tags.toLowerCase().includes(kw))
      )
    }
  },
  inject: ['store'],
  mounted() {
    this.loadAttractions()
    this.loadData()
  },
  methods: {
    async loadAttractions() {
      try {
        const res = await api.get('/api/admin/attractions', { scenicSpotId: this.scenicId })
        if (res.data) this.attractions = res.data
      } catch(e) {}
    },
    async loadData() {
      this.loading = true
      try {
        const res = await api.get('/api/admin/knowledge-points', { scenicSpotId: this.scenicId })
        if (res.data) this.list = res.data
      } catch(e) { ElementPlus.ElMessage.error('加载知识库失败') }
      this.loading = false
    },
    showForm() {
      this.isEdit = false
      this.form = { id: null, title: '', content: '', category: '', tags: '', attractionId: null }
      this.dialogVisible = true
    },
    editForm(row) {
      this.isEdit = true
      this.form = {
        id: row.id, title: row.title, content: row.content || '',
        category: row.category || '', tags: row.tags || '',
        attractionId: row.attraction?.id || null
      }
      this.dialogVisible = true
    },
    async saveItem() {
      this.saving = true
      try {
        const body = {
          title: this.form.title, content: this.form.content,
          category: this.form.category, tags: this.form.tags,
          scenicSpot: { id: this.scenicId },
          attraction: this.form.attractionId ? { id: this.form.attractionId } : null
        }
        if (this.isEdit) {
          await api.put('/api/admin/knowledge-points/' + this.form.id, body)
          ElementPlus.ElMessage.success('知识点已更新')
        } else {
          await api.post('/api/admin/knowledge-points', body)
          ElementPlus.ElMessage.success('知识点已创建')
        }
        this.dialogVisible = false
        await this.loadData()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    },
    async delItem(row) {
      try {
        await ElementPlus.ElMessageBox.confirm('确认删除「' + row.title + '」？', '确认删除', { type: 'warning' })
        await api.del('/api/admin/knowledge-points/' + row.id)
        ElementPlus.ElMessage.success('已删除')
        await this.loadData()
      } catch(e) { if (e !== 'cancel') ElementPlus.ElMessage.error(e.message) }
    }
  }
}
