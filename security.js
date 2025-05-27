// Discord 웹훅 URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1376400964659187884/BWaxgoW-vmm0Y2qULxaEvueX4worat8Q4DlWVOiNyBa-hwDaiMgcYGq-eT8VBr-lMakX';

// 보안 관리 클래스
class SecurityManager {
    constructor() {
        this.devToolsOpen = false;
        this.devToolsCheckInterval = null;
        this.init();
    }

    init() {
        this.setupDevToolsDetection();
        this.setupKeyboardBlocking();
        this.setupContextMenuBlocking();
        this.detectVPN();
    }

    // 개발자 도구 감지
    setupDevToolsDetection() {
        this.devToolsCheckInterval = setInterval(() => {
            this.detectDevTools();
        }, 500);
    }

    detectDevTools() {
        const threshold = 160;
        
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!this.devToolsOpen) {
                this.devToolsOpen = true;
                this.handleDevToolsOpen();
            }
        } else {
            this.devToolsOpen = false;
        }
    }

    async handleDevToolsOpen() {
        // 화면을 검은색으로 만들기
        document.body.style.background = '#000';
        document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 50vh; font-size: 24px;">⚠️ 개발자 도구 사용이 감지되었습니다.</div>';
        
        // Discord 웹훅으로 알림 전송
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const userIP = ipData.ip;

            const locationResponse = await fetch(`https://ipapi.co/${userIP}/json/`);
            const locationData = await locationResponse.json();

            const currentUser = this.getCurrentUser();

            const embed = {
                title: '🚨 개발자 도구 사용 감지',
                color: 0xff0000,
                fields: [
                    {
                        name: '👤 사용자',
                        value: currentUser ? currentUser.username : '알 수 없음',
                        inline: true
                    },
                    {
                        name: '📍 IP 주소',
                        value: userIP,
                        inline: true
                    },
                    {
                        name: '🌍 위치',
                        value: `${locationData.city || '알 수 없음'}, ${locationData.country_name || '알 수 없음'}`,
                        inline: true
                    },
                    {
                        name: '📄 페이지',
                        value: window.location.pathname,
                        inline: true
                    },
                    {
                        name: '🕒 감지 시간',
                        value: new Date().toLocaleString('ko-KR'),
                        inline: false
                    },
                    {
                        name: '🌐 브라우저',
                        value: navigator.userAgent,
                        inline: false
                    }
                ],
                footer: {
                    text: 'BlackNuse Security Alert'
                },
                timestamp: new Date().toISOString()
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    embeds: [embed]
                })
            });
        } catch (error) {
            console.error('웹훅 전송 실패:', error);
        }

        // 3초 후 페이지 닫기
        setTimeout(() => {
            window.close();
            window.location.href = 'about:blank';
        }, 3000);
    }

    // 키보드 이벤트 차단
    setupKeyboardBlocking() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                this.handleDevToolsOpen();
                return false;
            }
        });
    }

    // 우클릭 차단
    setupContextMenuBlocking() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleDevToolsOpen();
        });
    }

    // VPN 감지
    async detectVPN() {
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const userIP = ipData.ip;

            const vpnResponse = await fetch(`https://ipapi.co/${userIP}/json/`);
            const vpnData = await vpnResponse.json();

            if (vpnData.org && (
                vpnData.org.toLowerCase().includes('vpn') ||
                vpnData.org.toLowerCase().includes('proxy') ||
                vpnData.org.toLowerCase().includes('hosting') ||
                vpnData.org.toLowerCase().includes('datacenter')
            )) {
                const securityCheck = document.getElementById('security-check');
                if (securityCheck) {
                    securityCheck.style.display = 'block';
                }
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 3000);
                return false;
            }

            return true;
        } catch (error) {
            console.error('VPN 감지 실패:', error);
            return true;
        }
    }

    // 현재 사용자 가져오기
    getCurrentUser() {
        const user = localStorage.getItem('blacknuse-current-user');
        return user ? JSON.parse(user) : null;
    }

    // Discord 웹훅 전송
    static async sendToDiscord(title, description, fields = []) {
        try {
            const embed = {
                title: title,
                description: description,
                color: 0x667eea,
                fields: fields,
                footer: {
                    text: 'BlackNuse System'
                },
                timestamp: new Date().toISOString()
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    embeds: [embed]
                })
            });
        } catch (error) {
            console.error('Discord 웹훅 전송 실패:', error);
        }
    }
}

// 전역에서 사용할 수 있도록 설정
window.SecurityManager = SecurityManager;
