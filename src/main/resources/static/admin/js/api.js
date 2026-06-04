/**
 * API请求封装 - 统一管理token和错误处理
 */
const api = {
  baseURL: '',

  getToken() {
    return localStorage.getItem('admin_token') || ''
  },

  async request(url, options = {}) {
    const token = this.getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...options.headers
    }

    const res = await fetch(this.baseURL + url, { ...options, headers })
    const data = await res.json()

    if (data.code === 401) {
      localStorage.clear()
      location.href = 'login.html'
      throw new Error('请先登录')
    }

    if (data.code !== 200 && data.code !== 0) {
      throw new Error(data.message || '请求失败')
    }

    return data
  },

  get(url, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(url + (query ? '?' + query : ''))
  },

  post(url, body = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  },

  put(url, body = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  },

  del(url) {
    return this.request(url, { method: 'DELETE' })
  }
}
