/**
 * 系统设置页面
 */
const SystemPage = {
  template: `
  <div class="page-container">
    <el-card class="config-card">
      <template #header><div class="card-header"><span>修改密码</span></div></template>
      <el-form :model="pwdForm" label-width="100px" style="max-width:400px">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="saving">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" style="margin-top:20px">
      <template #header><div class="card-header"><span>系统配置</span></div></template>
      <el-form :model="sysForm" label-width="120px" style="max-width:500px">
        <el-form-item label="系统名称">
          <el-input v-model="sysForm.systemName" placeholder="AI智能导游系统"></el-input>
        </el-form-item>
        <el-form-item label="默认景区ID">
          <el-input-number v-model="sysForm.defaultScenicId" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSystemConfig" :loading="savingSys">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" style="margin-top:20px">
      <template #header><div class="card-header"><span>关于系统</span></div></template>
      <p style="line-height:2;color:#666">
        <strong>AI智能导游管理系统</strong><br>
        基于 Spring Boot 4.0.5 + Vue 3 + Element Plus 构建<br>
        AI引擎：阿里云 DashScope Qwen3.5-omni-plus<br>
        TTS：CosyVoice | ASR：Paraformer<br>
        地图服务：高德地图 API
      </p>
    </el-card>
  </div>
  `,
  data() {
    return {
      saving: false, savingSys: false,
      pwdForm: { oldPassword: '', newPassword: '', confirmPassword: '' },
      sysForm: { systemName: 'AI智能导游系统', defaultScenicId: 1 }
    }
  },
  methods: {
    async changePassword() {
      if (!this.pwdForm.oldPassword || !this.pwdForm.newPassword) {
        ElementPlus.ElMessage.warning('请填写完整')
        return
      }
      if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
        ElementPlus.ElMessage.warning('两次输入的密码不一致')
        return
      }
      if (this.pwdForm.newPassword.length < 6) {
        ElementPlus.ElMessage.warning('新密码长度不能少于6位')
        return
      }
      this.saving = true
      try {
        await api.post('/api/admin/change-password', {
          oldPassword: this.pwdForm.oldPassword,
          newPassword: this.pwdForm.newPassword
        })
        ElementPlus.ElMessage.success('密码修改成功，请重新登录')
        this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' }
        setTimeout(() => store.logout(), 1500)
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.saving = false
    },
    async saveSystemConfig() {
      this.savingSys = true
      try {
        await api.put('/api/admin/config', {
          systemName: this.sysForm.systemName,
          defaultScenicId: String(this.sysForm.defaultScenicId)
        })
        ElementPlus.ElMessage.success('系统配置已保存')
      } catch(e) { ElementPlus.ElMessage.error(e.message) }
      this.savingSys = false
    }
  }
}
