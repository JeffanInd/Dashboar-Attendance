import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB6IOPUC-6JdFGhDdLCxfupc1dye92ACr0",
    authDomain: "dashboard-attendance-c6b7d.firebaseapp.com",
    projectId: "dashboard-attendance-c6b7d",
    storageBucket: "dashboard-attendance-c6b7d.firebasestorage.app",
    messagingSenderId: "1017774629688",
    appId: "1:1017774629688:web:dd662f017b2cf0200f57cd",
    measurementId: "G-KCJQ5CKYJ3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let editId = null;
let chartInstances = [];
let attendanceTemp = [];

/* CLOCK */
function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    const datetime = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const t = document.querySelector(".time");
    const dt = document.querySelector(".datetime");

    if (t) t.textContent = time;
    if (dt) dt.textContent = datetime;
}

updateClock();
setInterval(updateClock, 1000);

/* LOGIN */
window.login = async () => {
    try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        const result = await signInWithEmailAndPassword(auth, email, password);

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";

        const name = document.getElementById("loginName");
        if (name) name.innerHTML = result.user.email;

        loadDashboard();

    } catch (error) {
        const info = document.getElementById("loginInfo");
        if (info) info.innerHTML = error.message;
        console.error(error);
    }
};

/* AUTH */
onAuthStateChanged(auth, user => {
    if (user) {

        const login = document.getElementById("loginPage");
        const dash = document.getElementById("dashboard");
        const name = document.getElementById("loginName");

        if (login) login.style.display = "none";
        if (dash) dash.style.display = "flex";
        if (name) name.innerHTML = user.email;

        loadDashboard();

    }
});

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.textContent = "🙈";
    } else {
        password.type = "password";
        togglePassword.textContent = "👁";
    }

});

/* LOGOUT */
window.logout = async () => {
    await signOut(auth);
    location.reload();
};

/* SIDEBAR SUBMENU */
function toggleMenu(menuId) {
    const menus = document.querySelectorAll(".submenu");
    const buttons = document.querySelectorAll(".menu-btn");
    menus.forEach(menu => {
        if (menu.id !== menuId) {
            menu.style.display = "none";
        }
    });

    buttons.forEach(btn => {
        btn.classList.remove("active");
    });

    const menu = document.getElementById(menuId);

    if (!menu) return;

    const btn = document.querySelector(
        `[onclick="toggleMenu('${menuId}')"]`
    );

    if (menu.style.display === "block") {
        menu.style.display = "none";
        if (btn) btn.classList.remove("active");
    } else {
        menu.style.display = "block";
        if (btn) btn.classList.add("active");
    }
}

window.toggleMenu = toggleMenu;
/* DASHBOARD */
window.loadDashboard = () => {
    const content = document.getElementById("content");
    if (!content) return;
    content.innerHTML = `

<div class="dashboard-kpi">
<div class="kpi-container">

<div class="kpi-card blue">
<h4>Total Karyawan</h4>
<h1>250</h1>
<span>Employee Active</span>
</div>

<div class="kpi-card green">
<h4>Kehadiran Hari Ini</h4>
<h1>96%</h1>
<span>Present</span>
</div>

<div class="kpi-card orange">
<h4>Terlambat</h4>
<h1>12</h1>
<span>Late Employee</span>
</div>

<div class="kpi-card purple">
<h4>Karyawan Baru</h4>
<h1>8</h1>
<span>This Month</span>
</div>

<div class="kpi-card red">
<h4>Departemen</h4>
<h1>12</h1>
<span>Total Division</span>
</div>
</div>

<div class="chart-grid">
<div class="card chart-box">
<h3>Gender Employee</h3>
<canvas id="genderChart"></canvas>
</div>

<div class="card chart-box">
<h3>Attendance Monthly</h3>
<canvas id="attendanceChart"></canvas>
</div>

<div class="card chart-box">
<h3>Employee Department</h3>
<canvas id="departmentChart"></canvas>
</div>

<div class="card chart-box">
<h3>Attendance Status</h3>
<canvas id="statusChart"></canvas>
</div>

<div class="card chart-box">
<h3>Department Performance</h3>
<canvas id="performanceChart"></canvas>
</div>

<div class="card chart-box">
<h3>Employee Age</h3>
<canvas id="ageChart"></canvas>
</div>

</div>
</div>
`;

    createDashboardChart();

};

/* DATA KARYAWAN */
window.showAddEmployee = () => {
    const content = document.getElementById("content");
    if (!content) return;
    content.innerHTML = `
<div class="card">
<h2>Employee Data</h2>
<div class="employee-form-grid">

<div class="form-group">
<label>ID Attendance</label>
<input id="kode" placeholder="ID Attendance" readonly>
</div>

<div class="form-group">
<label>Employee Name</label>
<input id="nama" placeholder="Employee Name">
</div>

<div class="form-group">
<label>Gender</label>
<select id="gender">
<option value="Male">Male</option>
<option value="Female">Female</option>
</select>
</div>

<div class="form-group">
<label>Jobs</label>
<input id="jabatan" placeholder="Jobs">
</div>

<div class="form-group">
<label>Birthday</label>
<input id="tanggalLahir" type="date">
</div>

<div class="form-group">
<label>Address</label>
<textarea id="alamat" placeholder="Address"></textarea>
</div>

<div class="form-group">
<label>Education</label>
<input id="pendidikan" placeholder="Education">
</div>

<div class="form-group">
<label>Contact</label>
<input id="hp" placeholder="Contact">
</div>

<div class="form-group">
<label>Bank Account</label>
<input id="rekening" placeholder="Bank Account">
</div>

<div class="form-group">
<label>Bank Name</label>
<select id="bank">
<option value="BCA">BCA</option>
<option value="Mandiri">Mandiri</option>
<option value="BNI">BNI</option>
<option value="BRI">BRI</option>
<option value="CIMB Niaga">CIMB Niaga</option>
<option value="Danamon">Danamon</option>
<option value="Lainnya">Lainnya</option>
</select>
</div>
</div>

<div style="margin-top:20px;display:flex;gap:10px">
<button onclick="saveEmployee()">💾 Save Data</button>
<button onclick="clearForm()">🧹 Reset</button>
</div>
</div>

<div class="card">
<h2>Employee List</h2>
<div class="table-container">
<table>
<thead>
<tr>
<th>ID Attendance</th>
<th>Employee Name</th>
<th>Gender</th>
<th>Jobs</th>
<th>Birthday</th>
<th>Address</th>
<th>Education</th>
<th>Contact</th>
<th>Bank Account</th>
<th>Bank Name</th>
<th>Action</th>
</tr>
</thead>
<tbody id="employeeTable"></tbody>
</table>
</div>
</div>

`;
    generateCode();
    loadEmployees();
};
/* GENERATE KODE */
async function generateCode() {
    try {
        const snap = await getDocs(
            collection(db, "employees")
        );
        const nomor = snap.size + 1;
        const kode =
            "KARY" + String(nomor).padStart(3, "0");
        const el = document.getElementById("kode");
        if (el) {
            el.value = kode;

        }
    } catch (error) {
        console.error(error);
    }
}

/* SAVE DATA */
window.saveEmployee = async () => {
    try {
        const fields = [
            "nama",
            "gender",
            "jabatan",
            "tanggalLahir",
            "alamat",
            "pendidikan",
            "hp",
            "rekening",
            "bank"
        ];

        for (const id of fields) {
            const el = document.getElementById(id);
            if (!el || String(el.value).trim() === "") {
                alert("Silahkan isi semua data karyawan terlebih dahulu!");
                if (el) el.focus();
                return;
            }
        }

        const data = {
            kodeKaryawan: document.getElementById("kode").value,
            namaKaryawan: document.getElementById("nama").value,
            jenisKelamin: document.getElementById("gender").value,
            jabatan: document.getElementById("jabatan").value,
            tanggalLahir: document.getElementById("tanggalLahir").value,
            alamat: document.getElementById("alamat").value,
            pendidikanTerakhir: document.getElementById("pendidikan").value,
            noHp: document.getElementById("hp").value,
            nomorRekening: document.getElementById("rekening").value,
            bank: document.getElementById("bank").value
        };

        if (editId) {
            await updateDoc(
                doc(db, "employees", editId),
                data
            );
            editId = null;
        } else {
            await addDoc(
                collection(db, "employees"),
                data
            );
        }

        alert("Data berhasil disimpan");
        clearForm();
        generateCode();
        loadEmployees();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};

/* LOAD DATA */
async function loadEmployees() {
    const tbody =
        document.getElementById("employeeTable");

    if (!tbody) return;
    tbody.innerHTML = "";

    try {
        const q = query(
            collection(db, "employees"),
            orderBy("kodeKaryawan")
        );

        const snap = await getDocs(q);
        snap.forEach(item => {
            const d = item.data();
            tbody.innerHTML += `
<tr>
<td>${d.kodeKaryawan || ""}</td>
<td>${d.namaKaryawan || ""}</td>
<td>${d.jenisKelamin || ""}</td>
<td>${d.jabatan || ""}</td>
<td>${d.tanggalLahir || ""}</td>
<td>${d.alamat || ""}</td>
<td>${d.pendidikanTerakhir || ""}</td>
<td>${d.noHp || ""}</td>
<td>${d.nomorRekening || ""}</td>
<td>${d.bank || ""}</td>
<td>
<button class="edit"
onclick="editEmployee('${item.id}')">
✏️ Edit
</button>
<button class="delete"
onclick="deleteEmployee('${item.id}')">
🗑 Delete
</button>
</td>
</tr>
`;
        });
    } catch (error) {
        console.error(error);
    }
}
/* EDIT */
window.editEmployee = async (id) => {
    try {
        editId = id;
        const snap = await getDocs(
            collection(db, "employees")
        );

        snap.forEach(item => {
            if (item.id === id) {
                const d = item.data();
                document.getElementById("kode").value = d.kodeKaryawan || "";
                document.getElementById("nama").value = d.namaKaryawan || "";
                document.getElementById("gender").value = d.jenisKelamin || "";
                document.getElementById("jabatan").value = d.jabatan || "";
                document.getElementById("tanggalLahir").value = d.tanggalLahir || "";
                document.getElementById("alamat").value = d.alamat || "";
                document.getElementById("pendidikan").value = d.pendidikanTerakhir || "";
                document.getElementById("hp").value = d.noHp || "";
                document.getElementById("rekening").value = d.nomorRekening || "";
                document.getElementById("bank").value = d.bank || "";
            }
        });
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    } catch (error) {
        console.error(error);
    }
};

/* DELETE */
window.deleteEmployee = async (id) => {
    if (confirm("Hapus data karyawan?")) {
        try {
            await deleteDoc(
                doc(db, "employees", id)
            );

            loadEmployees();
            generateCode();

        } catch (error) {
            console.error(error);
        }
    }
};
/* RESET FORM */
window.clearForm = () => {
    const ids = [
        "nama",
        "gender",
        "jabatan",
        "tanggalLahir",
        "alamat",
        "pendidikan",
        "hp",
        "rekening"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
        }
    });
    const bank = document.getElementById("bank");
    if (bank) {
        bank.selectedIndex = 0;
    }
    editId = null;
};

/* HITUNG KARYAWAN */
async function getEmployeeCount() {
    const snap = await getDocs(
        collection(db, "employees")
    );

    return snap.size;
}

/* ATTENDANCE */
window.showInputAttendance = async () => {
    const content = document.getElementById("content");
    content.innerHTML = `
<div class="card">
<h2>Input Attendance</h2>
<div class="attendance-form-grid">

<div class="form-group">
<label>Date of attendance</label>
<input type="date" id="attendanceDate">
</div>

<div class="form-group">
<label>Employee Name</label>
<select id="employeeSelect">
<option value="">-- Select Attendance --</option>
</select>
</div>

<div class="form-group button-align">
<label>&nbsp;</label>
<button onclick="addAttendanceRow()">📋✓ Add</button>
</div>
</div>

<br><br>
<table>
<thead>
<tr>
<th>ID Employee</th>
<th>Employee Name</th>
<th>Jobs</th>
<th>Status</th>
<th>Hapus</th>
</tr>
</thead>
<tbody id="attendanceTempTable"></tbody>
</table>
<br>
<button onclick="submitAttendance()">
Submit Attendance
</button>
</div>
<hr>
<div class="card">
<h2>Data Attendance</h2>
<div style="display:flex;gap:10px">
<select id="filterMonth"></select>
<select id="filterYear"></select>
<button onclick="loadAttendance()">
Cari
</button>
</div>
<br>
<table>
<thead>
<tr>
<th>Date Attendance</th>
<th>ID Employee</th>
<th>Employee Name</th>
<th>Jobs</th>
<th>Status</th>
</tr>
</thead>
<tbody id="attendanceTable"></tbody>
</table>
</div>
`;
    attendanceTemp = [];
    loadEmployeeSelect();
    fillMonthYear();
}

async function loadEmployeeSelect() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;
    select.innerHTML = `
<option value="">
-- Select Employee --
</option>
`;
    const snap = await getDocs(
        collection(db, "employees")
    );

    snap.forEach(doc => {
        const d = doc.data();
        select.innerHTML += `
<option value="${doc.id}">
${d.kodeKaryawan} - ${d.namaKaryawan}
</option>
`;
    });
}

window.addAttendanceRow = async () => {
    const tanggal = document.getElementById("attendanceDate").value;
    const id = document.getElementById("employeeSelect").value;

    // VALIDASI TANGGAL
    if(!tanggal){
        alert("Silahkan pilih tanggal absensi terlebih dahulu!");
        document.getElementById("attendanceDate").focus();
        return;
    }

    // VALIDASI KARYAWAN
    if(!id){
        alert("Silahkan pilih karyawan terlebih dahulu!");
        document.getElementById("employeeSelect").focus();
        return;
    }

    const snap = await getDocs(
        collection(db,"employees")
    );

    snap.forEach(item=>{
        if(item.id===id){
            const d=item.data();
            // CEK DUPLIKAT KARYAWAN DI TABEL SEMENTARA
            const sudahAda = attendanceTemp.some(
                emp=>emp.kode===d.kodeKaryawan
            );
            if(sudahAda){
                alert("Karyawan ini sudah ditambahkan!");
                return;
            }
            attendanceTemp.push({
                tanggal:tanggal,
                kode:d.kodeKaryawan,
                nama:d.namaKaryawan,
                jabatan:d.jabatan,
                status:"Hadir"
            });
        }
    });
    renderAttendanceTemp();
}

function renderAttendanceTemp() {
    const tbody = document.getElementById("attendanceTempTable");
    tbody.innerHTML = "";
    attendanceTemp.forEach((d, index) => {
        tbody.innerHTML += `
<tr>
<td>${d.kode}</td>
<td>${d.nama}</td>
<td>${d.jabatan}</td>
<td>
<select onchange="attendanceTemp[${index}].status=this.value">
<option ${d.status == "Hadir" ? "selected" : ""}>Hadir</option>
<option ${d.status == "Tidak Hadir" ? "selected" : ""}>Tidak Hadir</option>
<option ${d.status == "Izin" ? "selected" : ""}>Izin</option>
<option ${d.status == "Cuti" ? "selected" : ""}>Cuti</option>
</select>
</td>
<td>
<button onclick="removeAttendance(${index})">
Delete
</button>
</td>
</tr>
`;
    });
}
window.removeAttendance = (i) => {
    attendanceTemp.splice(i, 1);
    renderAttendanceTemp();
}

window.submitAttendance = async()=>{
if(attendanceTemp.length==0){
alert("Belum ada data attendance.");
return;
}

for(const d of attendanceTemp){
if(!d.tanggal){
alert(
"Data attendance ditemukan tanpa tanggal. Silahkan periksa kembali."
);

return;
}
const t=new Date(d.tanggal);
await addDoc(
collection(db,"attendance"),
{
tanggal:d.tanggal,
bulan:t.getMonth()+1,
tahun:t.getFullYear(),
kodeKaryawan:d.kode,
namaKaryawan:d.nama,
jabatan:d.jabatan,
status:d.status
}
);
}
alert("Attendance berhasil disimpan.");
attendanceTemp=[];
renderAttendanceTemp();
loadAttendance();
}

function fillMonthYear() {
    const bulan = document.getElementById("filterMonth");
    const tahun = document.getElementById("filterYear");

    bulan.innerHTML = "";
    const namaBulan = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "Augustus",
        "September",
        "October",
        "November",
        "December"
    ];

    namaBulan.forEach((nama, index) => {
        bulan.innerHTML += `
<option value="${index + 1}">
${nama}
</option>
`;
    });

    const tahunSekarang = new Date().getFullYear();
    tahun.innerHTML = "";
    for (let i = tahunSekarang - 5; i <= tahunSekarang + 10; i++) {
        tahun.innerHTML += `
<option value="${i}">
${i}
</option>
`;
    }
    bulan.value = new Date().getMonth() + 1;
    tahun.value = tahunSekarang;
}
window.loadAttendance = async () => {
    const tbody = document.getElementById("attendanceTable");
    tbody.innerHTML = "";
    const bulan = parseInt(document.getElementById("filterMonth").value);
    const tahun = parseInt(document.getElementById("filterYear").value);
    const q = query(
        collection(db, "attendance"),
        where("bulan", "==", bulan),
        where("tahun", "==", tahun)
    );

    const snap = await getDocs(q);
    snap.forEach(doc => {
        const d = doc.data();
        tbody.innerHTML += `
<tr>
<td>${d.tanggal}</td>
<td>${d.kodeKaryawan}</td>
<td>${d.namaKaryawan}</td>
<td>${d.jabatan}</td>
<td>${d.status}</td>
</tr>
`;
    });
}

/* DATA ATTENDANCE */
window.showDataAttendance = () => {
    const content = document.getElementById("content");
    content.innerHTML = `
<div class="card">
<h2>Data Attendance</h2>
<div class="attendance-filter">
<div class="form-group">
<label>Month</label>
<select id="attendanceMonth"></select>
</div>
<div class="form-group">
<label>Year</label>
<select id="attendanceYear"></select>
</div>
</div>
<br>
<div class="table-container">
<table>
<thead>
<tr>
<th>Date Attendance</th>
<th>ID Employee</th>
<th>Employee Name</th>
<th>Jobs</th>
<th>Status</th>
</tr>
</thead>
<tbody id="attendanceReportTable">
</tbody>
</table>
</div>
</div>
`;
    loadAttendanceFilter();
};

async function loadAttendanceFilter() {
    const bulan = document.getElementById("attendanceMonth");
    const tahun = document.getElementById("attendanceYear");
    const namaBulan = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "Augustus",
        "September",
        "October",
        "November",
        "December"
    ];

    // isi bulan
    bulan.innerHTML = "";
    namaBulan.forEach((b, index) => {
        bulan.innerHTML += `
<option value="${index + 1}">
${b}
</option>
`;
    });

    // isi tahun
    tahun.innerHTML = "";
    const sekarang = new Date();
    const tahunSekarang = sekarang.getFullYear();
    for (let i = tahunSekarang - 5; i <= tahunSekarang + 10; i++) {
        tahun.innerHTML += `
<option value="${i}">
${i}
</option>
`;
    }
    // posisi live system
    bulan.value = sekarang.getMonth() + 1;
    tahun.value = tahunSekarang;
    // event otomatis
    bulan.addEventListener(
        "change",
        loadAttendanceReport
    );

    tahun.addEventListener(
        "change",
        loadAttendanceReport
    );
    // tampilkan langsung
    loadAttendanceReport();
}
async function loadAttendanceReport() {
    const tbody = document.getElementById(
        "attendanceReportTable"
    );

    if (!tbody) return;
    tbody.innerHTML = "";
    const bulan = parseInt(
        document.getElementById("attendanceMonth").value
    );

    const tahun = parseInt(
        document.getElementById("attendanceYear").value
    );
    const q = query(
        collection(db, "attendance"),
        where("bulan", "==", bulan),
        where("tahun", "==", tahun)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
        tbody.innerHTML = `
<tr>
<td colspan="5" style="text-align:center">
Belum ada data attendance
</td>
</tr>
`;
        return;
    }
    snap.forEach(doc => {
        const d = doc.data();
        tbody.innerHTML += `
<tr>
<td>${d.tanggal}</td>
<td>${d.kodeKaryawan}</td>
<td>${d.namaKaryawan}</td>
<td>${d.jabatan}</td>
<td>${d.status}</td>
</tr>
`;
    });
}


/* DATA SALARY */
window.showSalary = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Data Salary</h2>
        <p>Daftar gaji.</p>
    </div>
    `;
}

/* KOPERASI */
window.showAddAnggota = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Add Anggota</h2>
    </div>
    `;
}
window.showInputSimpanan = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Input Simpanan</h2>
    </div>
    `;
}
window.showInputPinjaman = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Input Pinjaman</h2>
    </div>
    `;
}
window.showDataSimpanan = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Data Simpanan</h2>
    </div>
    `;
}
window.showDataPinjaman = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Data Pinjaman</h2>
    </div>
    `;
}
window.showNeraca = () => {
    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Neraca Koperasi</h2>
    </div>
    `;
}

/* UPDATE DASHBOARD TIME */
function updateDashboardTime() {
    const now = new Date();
    const tgl = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    const jam = now.toLocaleTimeString("id-ID");
    const tanggal = document.getElementById("tanggalDashboard");
    const waktu = document.getElementById("jamDashboard");
    if (tanggal) tanggal.innerHTML = tgl;
    if (waktu) waktu.innerHTML = jam;

}

setInterval(updateDashboardTime, 1000);
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    updateDashboardTime();

    const user = auth.currentUser;
    const name = document.getElementById("loginName");
    if (user && name) {
        name.innerHTML = user.email;
    }

});

/* CHART */
function createDashboardChart() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js belum dimuat");
        return;

    }
    /* HAPUS CHART LAMA */
    chartInstances.forEach(chart => {
        try {
            chart.destroy();
        } catch (e) { }

    });

    chartInstances = [];

    function makeChart(id, type, data) {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const chart = new Chart(canvas, {
            type: type,
            data: data
        });

        chartInstances.push(chart);
    }

    /* GENDER */
    makeChart(
        "genderChart",
        "doughnut",
        {

            labels: [
                "Male",
                "Female"
            ],

            datasets: [{
                data: [
                    150,
                    100
                ],

                backgroundColor: [
                    "#2563eb",
                    "#ec4899"
                ]
            }]
        }
    );

    /* ATTENDANCE */
    makeChart(
        "attendanceChart",
        "line",
        {

            labels: [
                "1",
                "5",
                "10",
                "15",
                "20",
                "25",
                "30"
            ],

            datasets: [{

                label: "Attendance",

                data: [
                    230,
                    245,
                    240,
                    250,
                    248,
                    242,
                    250
                ],

                borderColor: "#16a34a",
                backgroundColor: "rgba(22,163,74,.2)",
                fill: true,
                tension: .4
            }]
        }
    );
    /* DEPARTMENT */
    makeChart(
        "departmentChart",
        "bar",
        {
            labels: [
                "IT",
                "HR",
                "Finance",
                "Production",
                "Marketing"
            ],

            datasets: [{
                label: "Employee",
                data: [
                    35,
                    20,
                    25,
                    80,
                    15
                ],

                backgroundColor: "#2563eb"
            }]
        }
    );

    /* STATUS */
    makeChart(
        "statusChart",
        "pie",
        {

            labels: [
                "Hadir",
                "Izin",
                "Sakit",
                "Alpha"
            ],

            datasets: [{

                data: [
                    220,
                    10,
                    15,
                    5
                ],

                backgroundColor: [
                    "#16a34a",
                    "#eab308",
                    "#2563eb",
                    "#dc2626"
                ]
            }]
        }
    );

    /* PERFORMANCE */
    makeChart(
        "performanceChart",
        "radar",
        {

            labels: [
                "IT",
                "HR",
                "Finance",
                "Production",
                "Marketing"
            ],

            datasets: [{
                label: "Performance",
                data: [
                    90,
                    80,
                    75,
                    95,
                    70
                ],

                backgroundColor: "rgba(37,99,235,.2)",
                borderColor: "#2563eb"
            }]
        }
    );

    /* AGE */
    makeChart(
        "ageChart",
        "polarArea",
        {

            labels: [
                "18-25",
                "26-35",
                "36-45",
                "46+"
            ],

            datasets: [{

                data: [
                    80,
                    100,
                    50,
                    20
                ],

                backgroundColor: [
                    "#2563eb",
                    "#16a34a",
                    "#eab308",
                    "#dc2626"
                ]
            }]
        }
    );
}

/* END */
console.log("Dashboard Attendance Loaded Successfully");
