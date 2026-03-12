
// Data storage in local storage or memory
let users = JSON.parse(localStorage.getItem('users') || '[]');
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

// Helper to save data
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Show section by id
function showSection(id) {
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'dashboard') updateDashboard();
    if (id === 'users') renderUsersTable();
    if (id === 'newDebt' || id === 'payment') populateUserSelects();
    if (id === 'history') renderHistoryTable();
}

// Update dashboard values
function updateDashboard() {
    const totalDebt = users.reduce((sum, u) => sum + (u.outstanding || 0), 0);
    const totalPaid = users.reduce((sum, u) => sum + (u.paid || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayPaid = transactions.filter(t => t.type === 'payment' && t.date === today).reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalDebt').querySelector('.amount').textContent = totalDebt.toFixed(2);
    document.getElementById('totalPaid').querySelector('.amount').textContent = totalPaid.toFixed(2);
    document.getElementById('todayPaid').querySelector('.amount').textContent = todayPaid.toFixed(2);
    document.getElementById('userCount').querySelector('.amount').textContent = users.length;
}

// Add new user
function addUser(event) {
    event.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const note = document.getElementById('userNote').value.trim();
    if (!name) return;
    const id = Date.now().toString();
    users.push({ id, name, phone, note, outstanding: 0, paid: 0 });
    saveData();
    document.getElementById('addUserForm').reset();
    alert('เพิ่มผู้เซ็นเรียบร้อย');
    showSection('users');
}

// Populate user selects
function populateUserSelects() {
    const debtSelect = document.getElementById('debtUserId');
    const paymentSelect = document.getElementById('paymentUserId');
    // Clear options
    debtSelect.innerHTML = '';
    paymentSelect.innerHTML = '';
    users.forEach(user => {
        const option1 = document.createElement('option');
        option1.value = user.id;
        option1.textContent = user.name;
        debtSelect.appendChild(option1);
        const option2 = document.createElement('option');
        option2.value = user.id;
        option2.textContent = user.name;
        paymentSelect.appendChild(option2);
    });
}

// Add new debt
function addDebt(event) {
    event.preventDefault();
    const userId = document.getElementById('debtUserId').value;
    const item = document.getElementById('debtItem').value.trim();
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const date = document.getElementById('debtDate').value;
    if (!userId || !item || !amount || !date) return;
    transactions.push({ id: Date.now().toString(), userId, item, amount, type: 'debt', date });
    const user = users.find(u => u.id === userId);
    user.outstanding = (user.outstanding || 0) + amount;
    saveData();
    document.getElementById('newDebtForm').reset();
    alert('บันทึกการเซ็นเงินเรียบร้อย');
    showSection('users');
}

// Add payment
function addPayment(event) {
    event.preventDefault();
    const userId = document.getElementById('paymentUserId').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    if (!userId || !amount || !date) return;
    transactions.push({ id: Date.now().toString(), userId, amount, type: 'payment', date });
    const user = users.find(u => u.id === userId);
    user.outstanding = (user.outstanding || 0) - amount;
    user.paid = (user.paid || 0) + amount;
    saveData();
    document.getElementById('paymentForm').reset();
    alert('บันทึกการจ่ายเงินเรียบร้อย');
    showSection('users');
}

// Render users table
function renderUsersTable() {
    const container = document.getElementById('usersTable');
    if (users.length === 0) {
        container.innerHTML = '<p>ยังไม่มีผู้เซ็นเงิน</p>';
        return;
    }
    let html = '<table><thead><tr><th>ชื่อ</th><th>เบอร์โทร</th><th>หมายเหตุ</th><th>ยอดค้าง</th><th>ยอดที่จ่ายแล้ว</th></tr></thead><tbody>';
    users.forEach(user => {
        html += `<tr><td>${user.name}</td><td>${user.phone || '-'}</td><td>${user.note || '-'}</td><td>${user.outstanding.toFixed(2)}</td><td>${(user.paid || 0).toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Render history table
function renderHistoryTable() {
    const container = document.getElementById('historyTable');
    if (transactions.length === 0) {
        container.innerHTML = '<p>ยังไม่มีประวัติการทำรายการ</p>';
        return;
    }
    let html = '<table><thead><tr><th>วันที่</th><th>ชื่อผู้เซ็น</th><th>ประเภท</th><th>รายการ</th><th>จำนวน</th></tr></thead><tbody>';
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    transactions.forEach(t => {
        const user = users.find(u => u.id === t.userId) || {};
        html += `<tr><td>${t.date}</td><td>${user.name || ''}</td><td>${t.type === 'debt' ? 'ค้าง' : 'จ่าย'}</td><td>${t.item || '-'}</td><td>${t.amount.toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Form event listeners
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addUserForm').addEventListener('submit', addUser);
    document.getElementById('newDebtForm').addEventListener('submit', addDebt);
    document.getElementById('paymentForm').addEventListener('submit', addPayment);
    // Initialize selects when page loaded
    populateUserSelects();
    updateDashboard();
});
