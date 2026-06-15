// auth.js - Firebase Init and Simple User Management
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSy...odA4",
    authDomain: "p2math-791c8.firebaseapp.com",
    projectId: "p2math-791c8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global exports for the other scripts
window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.query = query;
window.where = where;
window.getDocs = getDocs;
window.orderBy = orderBy;
window.limit = limit;

window.getUsername = () => {
    return getCookie("math_username") || "訪客";
};

// Cookie Helpers
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export { getCookie, setCookie };

window.resetUser = () => {
    setCookie("math_username", "", -1);
    location.reload();
};

// Main UI Logic
function displayUserHeader(username) {
    const existing = document.getElementById('user-greeting');
    if (existing) existing.remove();

    const header = document.createElement('div');
    header.id = 'user-greeting';
    // Position: middle top
    header.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border-2 border-indigo-500 font-bold text-indigo-600 flex items-center gap-2';
    header.innerHTML = `<span>👋</span> Hello! <span class="text-indigo-800 underline decoration-indigo-300 underline-offset-4">${username}</span>`;
    document.body.appendChild(header);
}

function showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'user-auth-modal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/90 backdrop-blur-md p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center transform transition-all border-8 border-white">
            <div class="text-6xl mb-6">🎓</div>
            <h2 class="text-4xl font-black text-slate-800 mb-4 tracking-tight">建立學生帳號</h2>
            <p class="text-slate-500 mb-8 text-xl font-medium">請輸入你的名字開始練習！</p>
            <input type="text" id="username-input" 
                class="w-full text-4xl text-center border-b-8 border-indigo-400 outline-none pb-4 mb-10 text-indigo-600 font-black bg-transparent"
                placeholder="輸入名字..." autocomplete="off">
            <button id="start-btn" 
                class="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-3xl font-bold shadow-2xl active:scale-95 transition-all">
                確認進入
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('username-input');
    input.focus();

    async function handleStart() {
        const val = input.value.trim();
        if (val) {
            setCookie("math_username", val, 365);
            try {
                // Save to Users collection
                await addDoc(collection(db, "Users"), {
                    username: val,
                    createdAt: new Date().toISOString()
                });
            } catch (e) {
                console.error("Error creating user:", e);
            }
            modal.remove();
            displayUserHeader(val);
            if (window.onUserSet) window.onUserSet(val);
        } else {
            input.classList.add('animate-shake');
            setTimeout(() => input.classList.remove('animate-shake'), 500);
        }
    }

    document.getElementById('start-btn').onclick = handleStart;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleStart(); };
}

// Initialization
export function checkUser() {
    const user = getCookie("math_username");
    if (!user) {
        showLoginModal();
    } else {
        displayUserHeader(user);
    }
}

// Auto-run unless disabled
if (!window.skipAuthInit) {
    checkUser();
}
