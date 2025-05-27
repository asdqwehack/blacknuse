// Import Firebase
import firebase from 'firebase/app';
import 'firebase/database';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBqJJQqJQqJQqJQqJQqJQqJQqJQqJQqJQq",
    authDomain: "blacknuse-project.firebaseapp.com",
    databaseURL: "https://blacknuse-project-default-rtdb.firebaseio.com",
    projectId: "blacknuse-project",
    storageBucket: "blacknuse-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 데이터베이스 참조
const dbRefs = {
    users: database.ref('users'),
    blacklist: database.ref('blacklist'),
    validKeys: database.ref('validKeys'),
    robloxAccounts: database.ref('robloxAccounts')
};

// 서버 데이터 관리 함수들
class FirebaseDataManager {
    // 사용자 데이터
    static async getUsers() {
        try {
            const snapshot = await dbRefs.users.once('value');
            return snapshot.val() ? Object.values(snapshot.val()) : [];
        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
            return [];
        }
    }

    static async saveUser(user) {
        try {
            await dbRefs.users.child(user.id).set(user);
            return true;
        } catch (error) {
            console.error('사용자 저장 실패:', error);
            return false;
        }
    }

    static async updateUser(userId, updates) {
        try {
            await dbRefs.users.child(userId).update(updates);
            return true;
        } catch (error) {
            console.error('사용자 업데이트 실패:', error);
            return false;
        }
    }

    static async deleteUser(userId) {
        try {
            await dbRefs.users.child(userId).remove();
            return true;
        } catch (error) {
            console.error('사용자 삭제 실패:', error);
            return false;
        }
    }

    // 블랙리스트 데이터
    static async getBlacklist() {
        try {
            const snapshot = await dbRefs.blacklist.once('value');
            return snapshot.val() ? Object.values(snapshot.val()) : [];
        } catch (error) {
            console.error('블랙리스트 데이터 로드 실패:', error);
            return [];
        }
    }

    static async addToBlacklist(item) {
        try {
            const key = dbRefs.blacklist.push().key;
            await dbRefs.blacklist.child(key).set({...item, id: key});
            return true;
        } catch (error) {
            console.error('블랙리스트 추가 실패:', error);
            return false;
        }
    }

    static async removeFromBlacklist(ip) {
        try {
            const snapshot = await dbRefs.blacklist.once('value');
            const blacklist = snapshot.val();
            if (blacklist) {
                for (let key in blacklist) {
                    if (blacklist[key].ip === ip) {
                        await dbRefs.blacklist.child(key).remove();
                        break;
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('블랙리스트 제거 실패:', error);
            return false;
        }
    }

    // 유효한 키 데이터
    static async getValidKeys() {
        try {
            const snapshot = await dbRefs.validKeys.once('value');
            return snapshot.val() ? Object.values(snapshot.val()) : [
                'BLACKNUSE2024',
                'PREMIUM2024',
                'SERVERSIDE2024',
                'ROBLOX2024',
                'EXECUTOR2024',
                'iOgIPYxw5k',
                'igx3lKfbJJ',
                '3zAVXdrcI6',
                'zQ1VXJdVYP',
                'bIVTwjIq9g'
            ];
        } catch (error) {
            console.error('키 데이터 로드 실패:', error);
            return [];
        }
    }

    static async addValidKey(key) {
        try {
            const keyId = dbRefs.validKeys.push().key;
            await dbRefs.validKeys.child(keyId).set(key);
            return true;
        } catch (error) {
            console.error('키 추가 실패:', error);
            return false;
        }
    }

    static async removeValidKey(key) {
        try {
            const snapshot = await dbRefs.validKeys.once('value');
            const keys = snapshot.val();
            if (keys) {
                for (let keyId in keys) {
                    if (keys[keyId] === key) {
                        await dbRefs.validKeys.child(keyId).remove();
                        break;
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('키 제거 실패:', error);
            return false;
        }
    }

    // 초기 데이터 설정
    static async initializeDefaultData() {
        try {
            // 기본 키 설정
            const keysSnapshot = await dbRefs.validKeys.once('value');
            if (!keysSnapshot.exists()) {
                const defaultKeys = [
                    'BLACKNUSE2024',
                    'PREMIUM2024',
                    'SERVERSIDE2024',
                    'ROBLOX2024',
                    'EXECUTOR2024',
                    'iOgIPYxw5k',
                    'igx3lKfbJJ',
                    '3zAVXdrcI6',
                    'zQ1VXJdVYP',
                    'bIVTwjIq9g'
                ];
                
                for (const key of defaultKeys) {
                    await this.addValidKey(key);
                }
            }
        } catch (error) {
            console.error('기본 데이터 초기화 실패:', error);
        }
    }
}

// 전역에서 사용할 수 있도록 설정
window.FirebaseDataManager = FirebaseDataManager;
