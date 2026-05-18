// Firebase and User Management for alan-math
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSy...odA4",
    authDomain: "p2math-791c8.firebaseapp.com",
    projectId: "p2math-791c8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global exports
window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.query = query;
window.where = where;
window.getDocs = getDocs;
window.orderBy = orderBy;
window.limit = limit;

// Cookie Helpers
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

window.getUsername = () => getCookie("math_username") || "Unknown User";

// User Management
export async function checkUser() {
    let username = getCookie("math_username");
    if (!username) {
        showLoginModal();
    } else {
        displayUserHeader(username);
    }
}

function displayUserHeader(username) {
    const existing = document.getElementById('user-greeting');
    if (existing) existing.remove();

    const header = document.createElement('div');
    header.id = 'user-greeting';
    header.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur px-6 py-2 rounded-full shadow-lg border border-indigo-100 font-bold text-indigo-600 animate-bounce';
    header.innerHTML = `👋 Hello! <span class="text-indigo-800">${username}</span>`;
    document.body.appendChild(header);
}

function showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'user-auth-modal';
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/90 backdrop-blur-sm p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center transform transition-all scale-100">
            <h2 class="text-3xl font-black text-slate-800 mb-2">歡迎來到數學練習！</h2>
            <p class="text-slate-500 mb-8 font-medium">請輸入你的名字來開始練習吧</p>
            <input type="text" id="username-input" 
                class="w-full text-3xl text-center border-b-4 border-indigo-400 outline-none pb-2 mb-8 text-indigo-600 font-bold"
                placeholder="你的名字..." autocomplete="off">
            <button id="start-btn" 
                class="w-full py-5 bg-indigo-600 text-white rounded-3xl text-2xl font-bold shadow-xl active:scale-95 transition-all">
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
            // Save to Users collection
            try {
                await addDoc(collection(db, "Users"), {
                    username: val,
                    createdAt: new Date().toISOString()
                });
            } catch (e) {
                console.error("Error saving user:", e);
            }
            modal.remove();
            displayUserHeader(val);
        }
    }

    document.getElementById('start-btn').onclick = handleStart;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleStart(); };
}

// Auto-run on import if requested
if (!window.skipAuth) {
    checkUser();
}
