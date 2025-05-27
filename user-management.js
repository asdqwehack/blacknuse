// Import FirebaseDataManager, Swal, and SecurityManager
const FirebaseDataManager = require('./FirebaseDataManager');
const Swal = require('sweetalert2');
const SecurityManager = require('./SecurityManager');

class UserManagementManager {
  constructor() {
    this.init()
  }

  async init() {
    this.loadUsersList()
  }

  async isIPBlacklisted(ip) {
    const blacklist = await FirebaseDataManager.getBlacklist()
    return blacklist.some((item) => item.ip === ip)
  }

  async loadUsersList() {
    const users = await FirebaseDataManager.getUsers()
    const usersList = document.getElementById("users-list")

    usersList.innerHTML = ""

    if (users.length === 0) {
      usersList.innerHTML =
        '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">등록된 사용자가 없습니다.</div>'
      return
    }

    for (const user of users) {
      const isBlacklisted = await this.isIPBlacklisted(user.ipAddress)
      const userRow = document.createElement("div")
      userRow.className = `user-row ${isBlacklisted ? "blacklisted" : ""}`

      userRow.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar ${isBlacklisted ? "blacklisted" : ""}">${user.username
        .charAt(0)
        .toUpperCase()}</div>
                    <div class="user-details">
                        <h4>${user.username} ${user.keyExpired ? "(키 만료됨)" : ""}</h4>
                        <p>${user.email} • 가입일: ${new Date(user.joinDate).toLocaleDateString()} ${
        isBlacklisted ? "• 🚫 블랙리스트" : ""
      }</p>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="action-btn view" onclick="userManagementManager.showUserDetail(${user.id})">
                        <i class='bx bx-show'></i> 상세보기
                    </button>
                    ${
                      isBlacklisted
                        ? `<button class="action-btn unblacklist" onclick="userManagementManager.unblacklistUser(${user.id})">
                                <i class='bx bx-check'></i> 블랙리스트 해제
                            </button>`
                        : `<button class="action-btn blacklist" onclick="userManagementManager.blacklistUser(${user.id})">
                                <i class='bx bx-block'></i> 블랙리스트
                            </button>`
                    }
                    <button class="action-btn deregister" onclick="userManagementManager.adminDeregisterUser(${user.id})">
                        <i class='bx bx-user-x'></i> 등록해제
                    </button>
                    <button class="action-btn delete" onclick="userManagementManager.deleteUser(${user.id})">
                        <i class='bx bx-trash'></i> 삭제
                    </button>
                </div>
            `
      usersList.appendChild(userRow)
    }
  }

  async showUserDetail(userId) {
    const users = await FirebaseDataManager.getUsers()
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const isBlacklisted = await this.isIPBlacklisted(user.ipAddress)

    Swal.fire({
      title: "사용자 상세 정보",
      html: `
                <div style="text-align: left;">
                    <p><strong>사용자명:</strong> ${user.username}</p>
                    <p><strong>이메일:</strong> ${user.email}</p>
                    <p><strong>IP 주소:</strong> ${user.ipAddress || "Unknown"} ${isBlacklisted ? "🚫 블랙리스트" : ""}</p>
                    <p><strong>위치:</strong> ${user.location || "Unknown"}</p>
                    <p><strong>등록 키:</strong> ${user.registrationKey}</p>
                    <p><strong>키 상태:</strong> ${
                      user.keyExpired ? `만료됨 (${new Date(user.expiredAt).toLocaleString()})` : "활성"
                    }</p>
                    <p><strong>로블록스 계정:</strong> ${user.robloxUsername || "등록되지 않음"}</p>
                    <p><strong>가입일:</strong> ${new Date(user.joinDate).toLocaleString()}</p>
                    <p><strong>마지막 로그인:</strong> ${new Date(user.lastLogin).toLocaleString()}</p>
                    <p><strong>실행한 스크립트 수:</strong> ${user.scriptsExecuted || 0}개</p>
                </div>
            `,
      confirmButtonText: "확인",
      width: "600px",
    })
  }

  async blacklistUser(userId) {
    const users = await FirebaseDataManager.getUsers()
    const user = users.find((u) => u.id === userId)
    if (!user || !user.ipAddress) return

    Swal.fire({
      title: "사용자 블랙리스트",
      text: `정말 ${user.username} 사용자의 IP (${user.ipAddress})를 블랙리스트에 추가하시겠습니까?`,
      input: "text",
      inputPlaceholder: "차단 사유를 입력하세요",
      showCancelButton: true,
      confirmButtonText: "블랙리스트 추가",
      cancelButtonText: "취소",
      confirmButtonColor: "#f44336",
      inputValidator: (value) => {
        if (!value) {
          return "차단 사유를 입력해주세요!"
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await FirebaseDataManager.addToBlacklist({
          ip: user.ipAddress,
          reason: result.value,
          blockedAt: new Date().toISOString(),
          blockedBy: "Admin",
        })

        // 키 만료 처리
        await FirebaseDataManager.updateUser(userId, {
          keyExpired: true,
          expiredAt: new Date().toISOString(),
          expiredReason: "블랙리스트 IP",
        })

        this.loadUsersList()

        SecurityManager.sendToDiscord("🚫 사용자 블랙리스트 추가", "관리자가 사용자를 블랙리스트에 추가했습니다.", [
          { name: "사용자", value: user.username, inline: true },
          { name: "IP 주소", value: user.ipAddress, inline: true },
          { name: "차단 사유", value: result.value, inline: false },
        ])

        Swal.fire({
          title: "블랙리스트 추가 완료",
          text: `사용자 ${user.username}의 IP가 블랙리스트에 추가되었습니다.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        })
      }
    })
  }

  async unblacklistUser(userId) {
    const users = await FirebaseDataManager.getUsers()
    const user = users.find((u) => u.id === userId)
    if (!user || !user.ipAddress) return

    await FirebaseDataManager.removeFromBlacklist(user.ipAddress)
    this.loadUsersList()

    SecurityManager.sendToDiscord("✅ 블랙리스트 해제", "관리자가 사용자를 블랙리스트에서 해제했습니다.", [
      { name: "사용자", value: user.username, inline: true },
      { name: "IP 주소", value: user.ipAddress, inline: true },
    ])

    Swal.fire({
      title: "블랙리스트 해제 완료",
      text: `사용자 ${user.username}의 IP가 블랙리스트에서 해제되었습니다.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  }

  async adminDeregisterUser(userId) {
    const users = await FirebaseDataManager.getUsers()
    const user = users.find((u) => u.id === userId)
    if (!user) return

    Swal.fire({
      title: "사용자 등록 해제",
      text: `정말 ${user.username} 사용자를 등록 해제하시겠습니까? 해당 키를 다시 사용할 수 있게 됩니다.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "등록 해제",
      cancelButtonText: "취소",
      confirmButtonColor: "#ff9800",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await FirebaseDataManager.deleteUser(userId)
        this.loadUsersList()

        SecurityManager.sendToDiscord("👤 사용자 등록 해제", "관리자가 사용자를 등록 해제했습니다.", [
          { name: "사용자", value: user.username, inline: true },
          { name: "해제된 키", value: user.registrationKey, inline: true },
        ])

        Swal.fire({
          title: "등록 해제 완료",
          text: "사용자가 성공적으로 등록 해제되었습니다.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }

  async deleteUser(userId) {
    const users = await FirebaseDataManager.getUsers()
    const user = users.find((u) => u.id === userId)
    if (!user) return

    Swal.fire({
      title: "사용자 삭제",
      text: `정말 ${user.username} 사용자를 완전히 삭제하시겠습니까?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#f44336",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await FirebaseDataManager.deleteUser(userId)
        this.loadUsersList()

        SecurityManager.sendToDiscord("🗑️ 사용자 삭제", "관리자가 사용자를 완전히 삭제했습니다.", [
          { name: "삭제된 사용자", value: user.username, inline: true },
          { name: "이메일", value: user.email, inline: true },
        ])

        Swal.fire({
          title: "삭제 완료",
          text: "사용자가 성공적으로 삭제되었습니다.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }
}

// 전역에서 사용할 수 있도록 설정
window.UserManagementManager = UserManagementManager
