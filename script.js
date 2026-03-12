// script.js
// Implements the front-end logic for the credit system using Firebase Firestore.

import { db } from './firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// In-memory arrays to hold users and transactions
let users = [];
let transactions = [];

/**
 * Fetch all user documents from Firestore and populate the `users` array.
 */
async function loadUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    users = [];
    snapshot.forEach(docSnap => {
        users.push({ id: docSnap.id, ...docSnap.data() });
    });
}

/**
 * Fetch all debt and payment documents from Firestore and populate the `transactions` array.
 */
async function loadTransactions() {
    transactions = [];
    // Debts
    const debtsSnap = await getDocs(collection(db, 'debts'));
    debtsSnap.forEach(d => {
        const data = d.data();
        transactions.push({ id: d.id, userId: data.userId, type: 'debt', item: data.item, amount: data.amount, date: data.date });
    });
    // Payments
    const paymentsSnap = await getDocs(collection(db, 'payments'));
    paymentsSnap.forEach(p => {
        const data = p.data();
        transactions.push({ id: p.id, userId: data.userId, type: 'payment', amount: data.amount, date: data.date });
    });
}

/**
 * Update the dashboard section with aggregated metrics and quick access buttons.
 */
async function updateDashboard() {
    await loadUsers();
    await loadTransactions();
    const totalDebt = users.reduce((sum, u) => sum + (u.outstanding || 0), 0);
    const totalPaid = users.reduce((sum, u) => sum + (u.totalPaid || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayPaid = transactions
        .filter(t => t.type === 'payment' && t.date === today)
        .reduce((sum, t) => sum + t.amount, 0);
    const dashHtml = `
        <h2>ภาพรวม</h2>
        <div class="cards">
            <div class="card">
                <i class="ri-money-dollar-circle-line"></i>
                <h3>ยอดค้างทั้งหมด</h3>
                <p>${totalDebt.toFixed(2)}</p>
            </div>
            <div class="card">
                <i class="ri-checkbox-circle-line"></i>
                <h3>ยอดจ่ายแล้ว</h3>
                <p>${totalPaid.toFixed(2)}</p>
            </div>
            <div class="card">
                <i class="ri-calendar-check-line"></i>
                <h3>ยอดจ่ายวันนี้</h3>
                <p>${todayPaid.toFixed(2)}</p>
            </div>
            <div class="card">
                <i class="ri-account-circle-line"></i>
                <h3>จำนวนผู้เซ็น</h3>
                <p>${users.length}</p>
            </div>
        </div>
        <h3 class="quick-title">เมนูด่วน</h3>
        <div class="quick-menu">
            <button onclick="showSection('users')">
                <i class="ri-user-3-line"></i>
                <span>ผู้เซ็น</span>
            </button>
            <button onclick="showSection('addDebt')">
                <i class="ri-file-add-line"></i>
                <span>เซ็นเงิน</span>
            </button>
            <button onclick="showSection('payment')">
                <i class="ri-wallet-3-line"></i>
                <span>ชำระเงิน</span>
            </button>
            <button onclick="showSection('history')">
                <i class="ri-history-line"></i>
                <span>ประวัติ</span>
            </button>
        </div>
    `;
    document.getElementById('dashboard').innerHTML = dashHtml;
}

/**
 * Render the users page, including the form to add a new user and a table of existing users.
 */
async function renderUsers() {
    await loadUsers();
    let html = '<h2>ผู้เซ็นเงิน</h2>';
    html += `
        <form id="userForm">
            <label>ชื่อผู้เซ็น:
                <input type="text" id="userName" required>
            </label>
            <label>เบอร์โทร:
                <input type="text" id="userPhone">
            </label>
            <label>หมายเหตุ:
                <input type="text" id="userNote">
            </label>
            <button type="submit">เพิ่มผู้เซ็น</button>
        </form>
    `;
    if (users.length > 0) {
        html += '<table><thead><tr><th>ชื่อ</th><th>เบอร์โทร</th><th>หมายเหตุ</th><th>ยอดค้าง</th><th>ยอดที่จ่ายแล้ว</th></tr></thead><tbody>';
        users.forEach(u => {
            html += `<tr><td>${u.name}</td><td>${u.phone || ''}</td><td>${u.note || ''}</td><td>${(u.outstanding || 0).toFixed(2)}</td><td>${(u.totalPaid || 0).toFixed(2)}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>ยังไม่มีผู้เซ็นเงิน</p>';
    }
    document.getElementById('users').innerHTML = html;
    const form = document.getElementById('userForm');
    if (form) form.addEventListener('submit', addUser);
}

/**
 * Event handler for adding a new user to Firestore.
 * @param {Event} event
 */
async function addUser(event) {
    event.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const note = document.getElementById('userNote').value.trim();
    if (!name) return;
    // Create the new user document with zero balances
    await addDoc(collection(db, 'users'), {
        name,
        phone,
        note,
        outstanding: 0,
        totalPaid: 0
    });
    // Refresh lists and dashboard
    await renderUsers();
    await updateDashboard();
}

/**
 * Populate a select element with user options.
 * @param {string} selectId - The ID of the select element to populate
 */
async function populateUserSelects(selectId) {
    await loadUsers();
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    users.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.name;
        select.appendChild(option);
    });
}

/**
 * Render the form for recording a new debt.
 */
async function renderDebtForm() {
    let html = '<h2>เซ็นเงิน</h2>';
    html += `
        <form id="debtForm">
            <label>ชื่อผู้เซ็น:
                <select id="debtUser" required></select>
            </label>
            <label>รายการสินค้า:
                <input type="text" id="debtItem" required>
            </label>
            <label>จำนวนเงิน:
                <input type="number" step="0.01" id="debtAmount" required>
            </label>
            <label>วันที่:
                <input type="date" id="debtDate" required>
            </label>
            <button type="submit">บันทึก</button>
        </form>
    `;
    document.getElementById('addDebt').innerHTML = html;
    await populateUserSelects('debtUser');
    const form = document.getElementById('debtForm');
    if (form) form.addEventListener('submit', addDebt);
}

/**
 * Event handler for adding a new debt transaction and updating user outstanding balance.
 * @param {Event} event
 */
async function addDebt(event) {
    event.preventDefault();
    const userId = document.getElementById('debtUser').value;
    const item = document.getElementById('debtItem').value.trim();
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const date = document.getElementById('debtDate').value;
    if (!userId || !item || !amount || !date) return;
    // Create debt document
    await addDoc(collection(db, 'debts'), {
        userId,
        item,
        amount,
        date
    });
    // Update user's outstanding field
    const user = users.find(u => u.id === userId);
    const newOutstanding = (user?.outstanding || 0) + amount;
    await updateDoc(doc(db, 'users', userId), {
        outstanding: newOutstanding
    });
    await renderDebtForm();
    await updateDashboard();
}

/**
 * Render the form for recording a payment.
 */
async function renderPaymentForm() {
    let html = '<h2>ชำระเงิน</h2>';
    html += `
        <form id="paymentForm">
            <label>ชื่อผู้เซ็น:
                <select id="paymentUser" required></select>
            </label>
            <label>จำนวนเงิน:
                <input type="number" step="0.01" id="paymentAmount" required>
            </label>
            <label>วันที่:
                <input type="date" id="paymentDate" required>
            </label>
            <button type="submit">บันทึก</button>
        </form>
    `;
    document.getElementById('payment').innerHTML = html;
    await populateUserSelects('paymentUser');
    const form = document.getElementById('paymentForm');
    if (form) form.addEventListener('submit', addPayment);
}

/**
 * Event handler for adding a payment transaction and updating user balances.
 * @param {Event} event
 */
async function addPayment(event) {
    event.preventDefault();
    const userId = document.getElementById('paymentUser').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    if (!userId || !amount || !date) return;
    // Create payment document
    await addDoc(collection(db, 'payments'), {
        userId,
        amount,
        date
    });
    // Update user's outstanding and totalPaid fields
    const user = users.find(u => u.id === userId);
    const newOutstanding = (user?.outstanding || 0) - amount;
    const newTotalPaid = (user?.totalPaid || 0) + amount;
    await updateDoc(doc(db, 'users', userId), {
        outstanding: newOutstanding,
        totalPaid: newTotalPaid
    });
    await renderPaymentForm();
    await updateDashboard();
}

/**
 * Render the history of all transactions (debts and payments) in a table.
 */
async function renderHistory() {
    await loadTransactions();
    await loadUsers();
    let html = '<h2>ประวัติการทำรายการ</h2>';
    if (transactions.length > 0) {
        html += '<table><thead><tr><th>วันที่</th><th>ชื่อผู้เซ็น</th><th>ประเภท</th><th>รายการ</th><th>จำนวน</th></tr></thead><tbody>';
        // Sort transactions by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        transactions.forEach(t => {
            const user = users.find(u => u.id === t.userId) || {};
            html += `<tr><td>${t.date}</td><td>${user.name || ''}</td><td>${t.type === 'debt' ? 'เซ็น' : 'จ่าย'}</td><td>${t.item || '-'}</td><td>${t.amount.toFixed(2)}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>ยังไม่มีรายการ</p>';
    }
    document.getElementById('history').innerHTML = html;
}

/**
 * Show the specified section by ID and trigger appropriate rendering functions.
 * @param {string} id - The ID of the section to show.
 */
async function showSection(id) {
    // Hide all sections
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    // Load content for the selected section
    if (id === 'dashboard') {
        await updateDashboard();
    } else if (id === 'users') {
        await renderUsers();
    } else if (id === 'addDebt') {
        await renderDebtForm();
    } else if (id === 'payment') {
        await renderPaymentForm();
    } else if (id === 'history') {
        await renderHistory();
    }
}

// Expose showSection to the global window object for inline event handlers
window.showSection = showSection;

// Initialize the dashboard and users list on page load
document.addEventListener('DOMContentLoaded', async () => {
    await updateDashboard();
    await renderUsers();
});