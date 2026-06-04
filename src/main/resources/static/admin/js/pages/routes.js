/**
 * 路线管理页面
 */
const RoutesPage = {
  template: `
  <div class="page-container">
    <div class="page-toolbar">
      <span style="color:#666">当前景区：<strong>{{ store.getCurrentScenic().name }}</strong></span>
      <el-button type="primary" @click="showForm()" style="margin-left:auto">+ 新增路线</el-button>
    </div>

    <div v-loading="loading" style="background:#fff;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f7fa;color:#909399;font-weight:600;font-size:14px">
          <th style="padding:12px 8px;text-align:left;width:60px">ID</th>
          <th style="padding:12px 8px;text-align:left;width:160px">名称</th>
          <th style="padding:12px 8px;text-align:left;width:100px">主题</th>
          <th style="padding:12px 8px;text-align:left;width:100px">建议时长</th>
          <th style="padding:12px 8px;text-align:left;width:100px">景点数</th>
          <th style="padding:12px 8px;text-align:left">描述</th>
          <th style="padding:12px 8px;text-align:left;width:200px">操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in list" :key="r.id" style="border-bottom:1px solid #ebeef5">
            <td style="padding:10px 8px">{{ r.id }}</td>
            <td style="padding:10px 8px">{{ r.name }}</td>
            <td style="padding:10px 8px">{{ r.theme || '-' }}</td>
            <td style="padding:10px 8px">{{ r.suggestedDuration || '-' }}</td>
            <td style="padding:10px 8px">{{ r.attractionCount || 0 }}</td>
            <td style="padding:10px 8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.description || '-' }}</td>
            <td style="padding:10px 8px;white-space:nowrap">
              <button @click="editForm(r)" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #dcdfe6;background:#fff;color:#606266;border-radius:4px;cursor:pointer">编辑</button>
              <button @click="manageAttractions(r)" style="margin-right:6px;padding:5px 12px;font-size:12px;border:1px solid #e6a23c;background:#e6a23c;color:#fff;border-radius:4px;cursor:pointer">景点</button>
              <button @click="delItem(r)" style="padding:5px 12px;font-size:12px;border:1px solid #e74c3c;background:#e74c3c;color:#fff;border-radius:4px;cursor:pointer">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 路线编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑路线' : '新增路线'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name"></el-input></el-form-item>
        <el-form-item label="主题"><el-input v-model="form.theme" placeholder="如：历史文化、自然风光..."></el-input></el-form-item>
        <el-form-item label="建议时长"><el-input v-model="form.suggestedDuration" placeholder="如：2-3小时"></el-input></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3"></el-input></el-form-item>
        <el-form-item label="贴士"><el-input v-model="form.tips" type="textarea" :rows="2"></el-input></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="1"></el-input-number></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 路线景点管理弹窗 -->
    <el-dialog v-model="attrDialogVisible" title="管理路线景点" width="700px" destroy-on-close>
      <div style="margin-bottom:12px">
        <el-select v-model="selectedAttractionId" placeholder="选择要添加的景点" style="width:300px">
          <el-option v-for="a in availableAttractions" :key="a.id" :label="a.name" :value="a.id"></el-option>
        </el-select>
        <el-button type="primary" @click="addAttraction" style="margin-left:8px">添加</el-button>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ebeef5">
        <thead><tr style="background:#f5f7fa;color:#909399;font-weight:600;font-size:14px">
          <th style="padding:10px 8px;text-align:left;width:60px">ID</th>
          <th style="padding:10px 8px;text-align:left">景点名称</th>
          <th style="padding:10px 8px;text-align:left;width:80px">顺序</th>
          <th style="padding:10px 8px;text-align:left">讲解重点</th>
          <th style="padding:10px 8px;text-align:left;width:80px">操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="ra in routeAttractions" :key="ra.id" style="border-bottom:1px solid #ebeef5">
            <td style="padding:10px 8px">{{ ra.id }}</td>
            <td style="padding:10px 8px">{{ ra.attraction?.name || '-' }}</td>
            <td style="padding:10px 8px">{{ ra.sortOrder }}</td>
            <td style="padding:10px 8px">{{ ra.explanationFocus || '-' }}</td>
            <td style="padding:10px 8px">
              <button @click="removeAttraction(ra)" style="padding:5px 12px;font-size:12px;border:1px solid #e74c3c;background:#e74c3c;color:#fff;border-radius:4px;cursor:pointer">移除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </el-dialog>
  </div>
  `,
  data() {
    return {
      loading: false, saving: false,
      list: [], availableAttractions: [],
      dialogVisible: false, isEdit: false, currentRouteId: null,
      form: { id: null, name: '', theme: '', suggestedDuration: '', description: '', tips: '', sortOrder: 99 },
      attrDialogVisible: false, routeAttractions: [], selectedAttractionId: null
    }
  },
  computed: {
    scenicId() { return store.currentScenicId }
  },
  inject: ['store'],
  mounted() { this.loadData() },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const res = await api.get('/api/admin/tour-routes', { scenicSpotId: this.scenicId })
        if (res.data) {
          this.list = res.data
          for (const route of this.list) {
            try {
              const ar = await api.get('/api/admin/tour-routes/' + route.id + '/attractions')
              route.attractionCount = ar.data ? ar.data.length : 0
            } catch(e) { route.attractionCount = 0 }
          }
        }
      } catch(e) { ElementPlus.ElMessage.error('加载路线失败') }
      this.loading = false
    },
    showForm() {
      this.isEdit = false
      this.form = { id: null, name: '', theme: '', suggestedDuration: '', description: '', tips: '', sortOrder: 99 }
      this.dialogVisible = true
    },
    editForm(row) {
      this.isEdit = true
      this.form = {
        id: row.id, name: row.name, theme: row.theme || '',
        suggestedDuration: row.suggestedDuration || '', description: row.description || '',
        tips: row.tips || '', sortOrder: row.sortOrder ?? 99
      }
      this.dialogVisible = true
    },
    async saveItem() {
      this.saving = true
      try {
        const body = {
          name: this.form.name, theme: this.form.theme,
          suggestedDuration: this.form.suggestedDuration,
          description: this.form.description, tips: this.form.tips,
          sortOrder: this.form.sortOrder,
          scenicSpot: { id: this.scenicId }
        }
        if (this.isEdit) {
          await api.put('/api/admin/tour-routes/' + this.form.id, body)
          ElementPlus.ElMessage.success('路线已更新')
        } else {
          await api.post('/api/admin/tour-routes', body)
          ElementPlus.ElMessage.success('路线已创建')
        }
        this.dialogVisible = false
        await this.loadData()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    },
    async delItem(row) {
      try {
        await ElementPlus.ElMessageBox.confirm('确认删除路线「' + row.name + '」？', '确认删除', { type: 'warning' })
        await api.del('/api/admin/tour-routes/' + row.id)
        ElementPlus.ElMessage.success('已删除')
        await this.loadData()
      } catch(e) { if (e !== 'cancel') ElementPlus.ElMessage.error(e.message) }
    },
    async manageAttractions(row) {
      this.currentRouteId = row.id
      this.selectedAttractionId = null
      try {
        const res = await api.get('/api/admin/tour-routes/' + row.id + '/attractions')
        this.routeAttractions = res.data || []
      } catch(e) { this.routeAttractions = [] }
      try {
        const ar = await api.get('/api/admin/attractions', { scenicSpotId: this.scenicId })
        this.availableAttractions = ar.data || []
      } catch(e) { this.availableAttractions = [] }
      this.attrDialogVisible = true
    },
    async addAttraction() {
      if (!this.selectedAttractionId) { ElementPlus.ElMessage.warning('请选择景点'); return }
      try {
        await api.post('/api/admin/tour-routes/' + this.currentRouteId + '/attractions', {
          attraction: { id: this.selectedAttractionId },
          sortOrder: this.routeAttractions.length + 1
        })
        ElementPlus.ElMessage.success('已添加')
        const res = await api.get('/api/admin/tour-routes/' + this.currentRouteId + '/attractions')
        this.routeAttractions = res.data || []
        this.selectedAttractionId = null
        await this.loadData()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
    },
    async removeAttraction(row) {
      try {
        await api.del('/api/admin/tour-routes/' + this.currentRouteId + '/attractions/' + row.id)
        ElementPlus.ElMessage.success('已移除')
        const res = await api.get('/api/admin/tour-routes/' + this.currentRouteId + '/attractions')
        this.routeAttractions = res.data || []
        await this.loadData()
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
    }
  }
}
