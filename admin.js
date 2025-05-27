class AdminManager {
  constructor() {
    this.generatedKey = ""
    this.validKeys = []
    this.init()
  }

  async init() {
    await this.loadValidKeys()
    this.updateAdminStats()
    this.loadKeysList()
  }

  async loadValidKeys() {
    const FirebaseDataManager = window.FirebaseDataManager; // Declare FirebaseDataManager
    this.validKeys = await FirebaseDataManager.getValidKeys()
  }

  generateNewKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    this.generatedKey = result
    document.getElementById("new-generated-key").textContent = result
    document.getElementById("generated-key-display").style.display = "block"

    const SecurityManager = window.SecurityManager; // Declare SecurityManager
    SecurityManager.sendToDiscord("🔑 새 키 생성", "관리자가 새로운 인증 키를 생성했습니다.", [
      { name: "생성된 키", value: result, inline: true },
      { name: "생성 시간", value: new Date().toLocaleString("ko-KR"), inline: true },
    ])
  }

  copyGeneratedKey() {
    if (this.generatedKey) {
      navigator.clipboard.writeText(this.generatedKey).then(() => {
        const Swal = window.Swal; // Declare Swal
        Swal.fire({
          title: "복사 완료",
          text: "키가 클립보드에 복사되었습니다.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      })
    }
  }

  async addGeneratedKey() {
    if (this.generatedKey && !this.validKeys.includes(this.generatedKey)) {
      const FirebaseDataManager = window.FirebaseDataManager; // Declare FirebaseDataManager
      await FirebaseDataManager.addValidKey(this.generatedKey)
      await this.loadValidKeys()
      this.loadKeysList()
      this.updateAdminStats()

      document.getElementById("generated-key-display").style.display = "none"

      const SecurityManager = window.SecurityManager; // Declare SecurityManager
      SecurityManager.sendToDiscord("✅ 키 시스템 추가", "새로운 키가 시스템에 추가되었습니다.", [
        { name: "추가된 키", value: this.generatedKey, inline: true },
        { name: "총 키 개수", value: this.validKeys.length.toString(), inline: true },
      ])

      this.generatedKey = ""

      const Swal = window.Swal; // Declare Swal
      Swal.fire({
        title: "키 추가 완료",
        text: "새로운 키가 시스템에 추가되었습니다.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })
    }
  }

  async deleteKey(key) {
    const Swal = window.Swal; // Declare Swal
    Swal.fire({
      title: "키 삭제",
      text: `정말 키 "${key}"를 삭제하시겠습니까?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#f44336",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const FirebaseDataManager = window.FirebaseDataManager; // Declare FirebaseDataManager
        await FirebaseDataManager.removeValidKey(key)
        await this.loadValidKeys()
        this.loadKeysList()
        this.updateAdminStats()

        const SecurityManager = window.SecurityManager; // Declare SecurityManager
        SecurityManager.sendToDiscord("🗑️ 키 삭제", "관리자가 키를 삭제했습니다.", [
          { name: "삭제된 키", value: key, inline: true },
          { name: "남은 키 개수", value: this.validKeys.length.toString(), inline: true },
        ])

        Swal.fire({
          title: "삭제 완료",
          text: "키가 성공적으로 삭제되었습니다.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }

  async loadKeysList() {
    const keyList = document.getElementById("key-list")
    const FirebaseDataManager = window.FirebaseDataManager; // Declare FirebaseDataManager
    const users = await FirebaseDataManager.getUsers()
    const usedKeys = users.map((u) => u.registrationKey)

    keyList.innerHTML = ""

    this.validKeys.forEach((key) => {
      const isUsed = usedKeys.includes(key)
      const keyItem = document.createElement("div")
      keyItem.className = "key-item"
      keyItem.innerHTML = `
                <div class="key-code">${key}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="key-status ${isUsed ? "used" : "available"}">
                        ${isUsed ? "사용됨" : "사용 가능"}
                    </div>
                    <button class="action-btn delete" onclick="adminManager.deleteKey('${key}')" title="키 삭제">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            `
      keyList.appendChild(keyItem)
    })
  }

  async updateAdminStats() {
    const FirebaseDataManager = window.FirebaseDataManager; // Declare FirebaseDataManager
    const users = await FirebaseDataManager.getUsers()
    const blacklist = await FirebaseDataManager.getBlacklist()
    const totalUsers = users.length
    const activeUsers = users.filter((u) => {
      const lastLogin = new Date(u.lastLogin)
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return lastLogin > dayAgo
    }).length

    const totalScripts = users.reduce((sum, user) => sum + (user.scriptsExecuted || 0), 0)
    const blacklistedIPs = blacklist.length
    const totalKeys = this.validKeys.length

    document.getElementById("total-users").textContent = totalUsers
    document.getElementById("active-users").textContent = activeUsers
    document.getElementById("total-scripts").textContent = totalScripts
    document.getElementById("blacklisted-ips").textContent = blacklistedIPs
    document.getElementById("total-keys").textContent = totalKeys
  }
}

// 전역에서 사용할 수 있도록 설정
window.AdminManager = AdminManager
