/**
 * 数字人配置页面
 */
const ConfigPage = {
  template: `
  <div class="page-container">
    <el-card class="config-card">
      <template #header><div class="card-header"><span>数字人导游配置</span></div></template>
      <el-form :model="form" label-width="120px" v-loading="loading">
        <el-form-item label="导游名称">
          <el-input v-model="form.guideName" placeholder="如：灵灵" style="width:300px"></el-input>
        </el-form-item>
        <el-form-item label="欢迎语">
          <el-input v-model="form.welcomeMsg" type="textarea" :rows="3" placeholder="游客进入时的欢迎语" style="width:400px"></el-input>
        </el-form-item>
        <el-form-item label="TTS语音音色">
          <el-select v-model="form.ttsVoice" style="width:300px">
            <el-option label="龙小春（女声-温柔）" value="longxiaochun"></el-option>
            <el-option label="龙小春V2（女声-活泼）" value="longxiaochun_v2"></el-option>
            <el-option label="龙婉（女声-知性）" value="longwan"></el-option>
            <el-option label="龙安阳（男声-沉稳）" value="longanyang"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="语速">
          <el-slider v-model="form.ttsSpeed" :min="0.5" :max="2.0" :step="0.1" show-input style="width:300px"></el-slider>
        </el-form-item>
        <el-form-item label="AI模型">
          <el-input v-model="form.aiModel" placeholder="如：qwen3.5-omni-plus" style="width:300px"></el-input>
        </el-form-item>
        <el-form-item label="回复最大字数">
          <el-input-number v-model="form.maxTokens" :min="50" :max="2000" :step="50"></el-input-number>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" style="margin-top:20px">
      <template #header><div class="card-header"><span>系统信息</span></div></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目名称">AI智能导游系统</el-descriptions-item>
        <el-descriptions-item label="版本">1.0.0</el-descriptions-item>
        <el-descriptions-item label="后端框架">Spring Boot 4.0.5</el-descriptions-item>
        <el-descriptions-item label="Java版本">17</el-descriptions-item>
        <el-descriptions-item label="AI引擎">DashScope Qwen</el-descriptions-item>
        <el-descriptions-item label="TTS引擎">CosyVoice</el-descriptions-item>
        <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
        <el-descriptions-item label="前端框架">Vue 3 + Element Plus</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
  `,
  data() {
    return {
      loading: false, saving: false,
      form: {
        guideName: '灵灵', welcomeMsg: '你好！我是灵灵，你的AI导游~',
        ttsVoice: 'longxiaochun', ttsSpeed: 1.0,
        aiModel: 'qwen3.5-omni-plus', maxTokens: 200
      }
    }
  },
  computed: {
    scenicId() { return store.currentScenicId }
  },
  inject: ['store'],
  async mounted() { await this.loadConfig() },
  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const res = await api.get('/api/admin/config', { scenicSpotId: this.scenicId })
        if (res.data) {
          if (res.data.guideName) this.form.guideName = res.data.guideName
          if (res.data.welcomeMsg) this.form.welcomeMsg = res.data.welcomeMsg
          if (res.data.ttsVoice) this.form.ttsVoice = res.data.ttsVoice
          if (res.data.ttsSpeed) this.form.ttsSpeed = parseFloat(res.data.ttsSpeed)
          if (res.data.aiModel) this.form.aiModel = res.data.aiModel
          if (res.data.maxTokens) this.form.maxTokens = parseInt(res.data.maxTokens)
        }
      } catch(e) { console.error('加载配置失败', e) }
      this.loading = false
    },
    async saveConfig() {
      this.saving = true
      try {
        await api.put('/api/admin/config?scenicSpotId=' + this.scenicId, {
          guideName: this.form.guideName,
          welcomeMsg: this.form.welcomeMsg,
          ttsVoice: this.form.ttsVoice,
          ttsSpeed: String(this.form.ttsSpeed),
          aiModel: this.form.aiModel,
          maxTokens: String(this.form.maxTokens)
        })
        ElementPlus.ElMessage.success('配置已保存')
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    }
  }
}
