// 어드민 계정 정보
const ADMIN_ACCOUNT = {
    username: 'excI',
    password: 'wjd4585y',
    email: 'admin@blacknuse.com',
    role: 'admin'
};

// FirebaseDataManager 및 SecurityManager 선언
const FirebaseDataManager = {
    async getValidKeys() {
        // Firebase에서 유효한 키 가져오기 로직 구현
        return [];
    },
    async getUsers() {
        // Firebase에서 사용자 목록 가져오기 로직 구현
        return [];
    },
    async updateUser(userId, updateData) {
        // Firebase에서 사용자 업데이트 로직 구현
    },
    async saveUser(newUser) {
        // Firebase에 새 사용자 저장 로직 구현
        return true;
    },
    async getBlacklist() {
        // Firebase에서 블랙리스트 가져오기 로직 구현
        return [];
    }
};

const SecurityManager = {
    async sendToDiscord(title, description, fields) {
        // Discord에 알림 보내기 로직 구현
    }
};

const Swal = {
    fire(options) {
        // 알림 팝업 구현
    }
};

// 인증 관리 클래스
class AuthManager {
    constructor() {
        this.validKeys = [];
        this.init();
    }

    async init() {
        await this.loadValidKeys();
    }

    async loadValidKeys() {
        this.validKeys = await FirebaseDataManager.getValidKeys();
    }

    // 폼 전환
    showLogin() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    }

    showRegister() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    }

    // 현재 사용자 관리
    setCurrentUser(user) {
        localStorage.setItem('blacknuse-current-user', JSON.stringify(user));
    }

    getCurrentUser() {
        const user = localStorage.getItem('blacknuse-current-user');
        return user ? JSON.parse(user) : null;
    }

    // 블랙리스트 확인
    async isIPBlacklisted(ip) {
        const blacklist = await FirebaseDataManager.getBlacklist();
        return blacklist.some(item => item.ip === ip);
    }

    // 로그인 처리
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        // 어드민 계정 확인
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            this.setCurrentUser(ADMIN_ACCOUNT);
            
            await SecurityManager.sendToDiscord(
                '👑 관리자 로그인',
                '관리자가 시스템에 로그인했습니다.',
                [
                    { name: '사용자', value: username, inline: true },
                    { name: '로그인 시간', value: new Date().toLocaleString('ko-KR'), inline: true }
                ]
            );
            
            window.location.href = 'dashboard.html';
            return;
        }
        
        // 일반 사용자 확인
        const users = await FirebaseDataManager.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            if (user.keyExpired) {
                Swal.fire({
                    title: '계정 접근 불가',
                    text: '귀하의 계정 키가 만료되었습니다. 관리자에게 문의하세요.',
                    icon: 'error',
                    confirmButtonText: '확인'
                });
                return;
            }
            
            // 마지막 로그인 시간 업데이트
            await FirebaseDataManager.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });
            
            user.lastLogin = new Date().toISOString();
            this.setCurrentUser(user);
            
            await SecurityManager.sendToDiscord(
                '🔑 사용자 로그인',
                '사용자가 시스템에 로그인했습니다.',
                [
                    { name: '사용자', value: username, inline: true },
                    { name: '이메일', value: user.email, inline: true },
                    { name: '로그인 시간', value: new Date().toLocaleString('ko-KR'), inline: false }
                ]
            );
            
            window.location.href = 'dashboard.html';
        } else {
            Swal.fire({
                title: '로그인 실패',
                text: '사용자명 또는 비밀번호가 올바르지 않습니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
        }
    }

    // 회원가입 처리
    async handleRegister(event) {
        event.preventDefault();
        
        const enteredKey = document.getElementById('registration-key').value.trim();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        // IP 정보 가져오기
        let userIP = 'Unknown';
        let locationInfo = 'Unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            userIP = ipData.ip;

            // 블랙리스트 확인
            if (await this.isIPBlacklisted(userIP)) {
                Swal.fire({
                    title: '접근 차단',
                    text: '귀하의 IP 주소는 블랙리스트에 등록되어 있어 계정을 생성할 수 없습니다.',
                    icon: 'error',
                    confirmButtonText: '확인'
                });
                return;
            }

            const locationResponse = await fetch(`https://ipapi.co/${userIP}/json/`);
            const locationData = await locationResponse.json();
            locationInfo = `${locationData.city || '알 수 없음'}, ${locationData.country_name || '알 수 없음'}`;
        } catch (error) {
            console.error('IP 정보 가져오기 실패:', error);
        }
        
        // 키 유효성 확인
        if (!this.validKeys.includes(enteredKey)) {
            Swal.fire({
                title: '잘못된 키',
                text: '유효하지 않은 인증 키입니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
            return;
        }
        
        // 비밀번호 확인
        if (password !== confirmPassword) {
            Swal.fire({
                title: '비밀번호 불일치',
                text: '비밀번호가 일치하지 않습니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
            return;
        }
        
        // 중복 확인
        const users = await FirebaseDataManager.getUsers();
        
        if (users.find(u => u.email === email)) {
            Swal.fire({
                title: '이메일 중복',
                text: '이미 사용 중인 이메일입니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
            return;
        }
        
        if (users.find(u => u.username === username)) {
            Swal.fire({
                title: '사용자명 중복',
                text: '이미 사용 중인 사용자명입니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
            return;
        }
        
        if (users.find(u => u.registrationKey === enteredKey)) {
            Swal.fire({
                title: '키 이미 사용됨',
                text: '이미 사용된 인증 키입니다.',
                icon: 'error',
                confirmButtonText: '확인'
            });
            return;
        }
        
        // 새 사용자 생성
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            registrationKey: enteredKey,
            role: 'user',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            robloxUsername: '',
            scriptsExecuted: 0,
            ipAddress: userIP,
            location: locationInfo,
            userAgent: navigator.userAgent,
            keyExpired: false
        };
        
        // Firebase에 저장
        const success = await FirebaseDataManager.saveUser(newUser);
        
        if (success) {
            // Discord 알림
            await SecurityManager.sendToDiscord(
                '🎉 새 사용자 등록',
                '새로운 사용자가 시스템에 등록되었습니다.',
                [
                    { name: '사용자명', value: username, inline: true },
                    { name: '이메일', value: email, inline: true },
                    { name: '사용된 키', value: enteredKey, inline: true },
                    { name: 'IP 주소', value: userIP, inline: true },
                    { name: '위치', value: locationInfo, inline: true },
                    { name: '등록 시간', value: new Date().toLocaleString('ko-KR'), inline: false }
                ]
            );
            
            Swal.fire({
                title: '회원가입 성공!',
                text: '계정이 성공적으로 생성되었습니다. 로그인해주세요.',
                icon: 'success',
                confirmButtonText: '확인'
            }).then(() => {
                this.showLogin();
                // 폼 초기화
                document.getElementById('registration-key').value = '';
                document.getElementById('register-username').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm').value = '';
            });
        } else {
            Swal.fire({
                title: '등록 실패',
                text: '계정 등록 중 오류가 발생했습니다. 다시 시도해주세요.',
                icon: 'error',
                confirmButtonText: '확인'
            });
        }
    }
}

// 전역에서 사용할 수 있도록 설정
window.AuthManager = AuthManager;
