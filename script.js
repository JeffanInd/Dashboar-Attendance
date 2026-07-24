import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, doc, setDoc, deleteDoc, updateDoc, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
<label>Start Work Date</label>
<input id="tanggalMulaiKerja" type="date">
</div>

<div class="form-group">
<label>ID Employee</label>
<input id="kode" placeholder="ID Employee" readonly>
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
<div style="display:flex;gap:10px;margin-bottom:15px;">
<input 
id="searchEmployee"
placeholder="Search ID Employee / Employee Name"
style="flex:1;padding:10px;">

<button onclick="searchEmployee()">
🔍 Search
</button>
</div>
<div class="table-container">
<table>
<thead>
<tr>
<th>ID Employee</th>
<th>Employee Name</th>
<th>Gender</th>
<th>Jobs</th>
<th>Birthday</th>
<th>Address</th>
<th>Education</th>
<th>Contact</th>
<th>Bank Account</th>
<th>Bank Name</th>
<th>Start Work Date</th>
<th>Action</th>
</tr>
</thead>
<tbody id="employeeTable"></tbody>
</table>
</div>
</div>
`;

    generateCode();
    document
        .getElementById("tanggalMulaiKerja")
        .addEventListener("change", updateEmployeeCode);
};


/* GENERATE KODE */
async function generateCode() {
    try {
        const snap = await getDocs(collection(db, "employees"));
        const nomor = String(snap.size + 1).padStart(3, "0");
        document.getElementById("kode").dataset.urut = nomor;
        document.getElementById("kode").value = "";

    } catch (error) {
        console.error(error);
    }
}

function updateEmployeeCode() {
    const tanggal = document.getElementById("tanggalMulaiKerja").value;
    if (!tanggal) return;
    const urut = document.getElementById("kode").dataset.urut || "001";
    const pecah = tanggal.split("-");
    const tahun = pecah[0].slice(-2);
    const bulan = pecah[1];
    const hari = pecah[2];

    document.getElementById("kode").value =
        `JFN${tahun}${bulan}${hari}${urut}`;
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
            "bank",
            "tanggalMulaiKerja"
        ];
        // Validasi field
        for (const id of fields) {
            const el = document.getElementById(id);
            if (!el || String(el.value).trim() === "") {
                alert("Silahkan isi semua data karyawan terlebih dahulu!");
                if (el) el.focus();
                return;
            }
        }

        if (document.getElementById("kode").value == "") {
            alert("Silahkan pilih Start Work Date terlebih dahulu.");
            return;
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
            bank: document.getElementById("bank").value,
            tanggalMulaiKerja: document.getElementById("tanggalMulaiKerja").value,
            status: "Active"
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
<td>${d.tanggalMulaiKerja || ""}</td>

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

window.searchEmployee = async () => {
    const keyword = document
        .getElementById("searchEmployee")
        .value
        .toLowerCase();
    const tbody = document.getElementById("employeeTable");
    tbody.innerHTML = "";
    if (keyword == "") {
        return;
    }
    const snap = await getDocs(
        collection(db, "employees")
    );
    snap.forEach(item => {
        const d = item.data();
        const kode = (d.kodeKaryawan || "").toLowerCase();
        const nama = (d.namaKaryawan || "").toLowerCase();
        if (
            kode.includes(keyword) ||
            nama.includes(keyword)
        ) {

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
<td>${d.tanggalMulaiKerja || ""}</td>
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

        }
    });
};

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
                document.getElementById("kode").readOnly = true;
                document.getElementById("nama").value = d.namaKaryawan || "";
                document.getElementById("gender").value = d.jenisKelamin || "";
                document.getElementById("jabatan").value = d.jabatan || "";
                document.getElementById("tanggalLahir").value = d.tanggalLahir || "";
                document.getElementById("alamat").value = d.alamat || "";
                document.getElementById("pendidikan").value = d.pendidikanTerakhir || "";
                document.getElementById("hp").value = d.noHp || "";
                document.getElementById("rekening").value = d.nomorRekening || "";
                document.getElementById("bank").value = d.bank || "";
                document.getElementById("tanggalMulaiKerja").value = d.tanggalMulaiKerja || "";
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
        "rekening",
        "tanggalMulaiKerja"
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

/* DATA EMPLOYEE */
window.showDataEmployee = () => {
    const content = document.getElementById("content");
    content.innerHTML = `
    <div class="card">
        <h2>Data Employee</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID Attendance</th>
                        <th>Employee Name</th>
                        <th>Gender</th>
                        <th>Jobs</th>
                        <th>Start Work Date</th>
                        <th>Contact</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="dataEmployeeTable"></tbody>
            </table>
        </div>
    </div>
    `;

    loadDataEmployee();
}

async function loadDataEmployee() {
    const tbody = document.getElementById("dataEmployeeTable");
    tbody.innerHTML = "";
    const q = query(
        collection(db, "employees"),
        orderBy("kodeKaryawan")
    );

    const snap = await getDocs(q);
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const status = d.status || "Active";
        tbody.innerHTML += `
        <tr>
        <td>${d.kodeKaryawan || ""}</td>
        <td>${d.namaKaryawan || ""}</td>
        <td>${d.jenisKelamin || ""}</td>
        <td>${d.jabatan || ""}</td>
        <td>${d.tanggalMulaiKerja || ""}</td>
        <td>${d.noHp || ""}</td>
        <td>
            <button
            class="${status == "Active" ? "edit" : "delete"}"
            onclick="changeEmployeeStatus('${docSnap.id}','${status}')">
            ${status}
            </button>
        </td>
        </tr>
        `;

    });
}
window.changeEmployeeStatus = async (id, status) => {
    const statusBaru =
        status == "Active"
            ? "Non Active"
            : "Active";
    await updateDoc(
        doc(db, "employees", id),
        {
            status: statusBaru
        }
    );
    loadDataEmployee();
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

    document.getElementById("attendanceDate").value =
        new Date().toISOString().split("T")[0];
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
    if (!tanggal) {
        alert("Silahkan pilih tanggal absensi terlebih dahulu!");
        document.getElementById("attendanceDate").focus();
        return;
    }
    // VALIDASI KARYAWAN
    if (!id) {
        alert("Silahkan pilih karyawan terlebih dahulu!");
        document.getElementById("employeeSelect").focus();
        return;
    }

    const snap = await getDocs(
        collection(db, "employees")
    );

    snap.forEach(item => {
        if (item.id === id) {
            const d = item.data();
            // CEK DUPLIKAT KARYAWAN DI TABEL SEMENTARA
            const sudahAda = attendanceTemp.some(
                emp => emp.kode === d.kodeKaryawan
            );
            if (sudahAda) {
                alert("Karyawan ini sudah ditambahkan!");
                return;
            }
            attendanceTemp.push({
                tanggal: tanggal,
                kode: d.kodeKaryawan,
                nama: d.namaKaryawan,
                jabatan: d.jabatan,
                status: "Hadir"
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
<select 
onchange="changeAttendanceStatus(${index},this.value)">
<option value="Hadir" ${d.status == "Hadir" ? "selected" : ""}>
Hadir
</option>
<option value="Alpha" ${d.status == "Alpha" ? "selected" : ""}>
Alpha
</option>
<option value="Izin" ${d.status == "Izin" ? "selected" : ""}>
Izin
</option>
<option value="Cuti" ${d.status == "Cuti" ? "selected" : ""}>
Cuti
</option>
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
window.changeAttendanceStatus = (index, status) => {
    attendanceTemp[index].status = status;
    console.log(
        "Status berubah:",
        attendanceTemp[index]
    );
};
window.removeAttendance = (i) => {
    attendanceTemp.splice(i, 1);
    renderAttendanceTemp();
}

window.submitAttendance = async () => {
    if (attendanceTemp.length == 0) {
        alert("Belum ada data attendance.");
        return;
    }

    for (const d of attendanceTemp) {
        if (!d.tanggal) {
            alert(
                "Data attendance ditemukan tanpa tanggal. Silahkan periksa kembali."
            );

            return;
        }
        const t = new Date(d.tanggal);
        await addDoc(
            collection(db, "attendance"),
            {
                tanggal: d.tanggal,
                bulan: t.getMonth() + 1,
                tahun: t.getFullYear(),
                kodeKaryawan: d.kode,
                namaKaryawan: d.nama,
                jabatan: d.jabatan,
                status: d.status
            }
        );
    }

    alert("Attendance berhasil disimpan.");
    attendanceTemp = [];
    renderAttendanceTemp();
    const table = document.getElementById("attendanceTable");
    if (table) {
        loadAttendance();
    }
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
        "August",
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
    if (!tbody) return;
    tbody.innerHTML = "";
    const bulan = parseInt(
        document.getElementById("filterMonth").value
    );
    const tahun = parseInt(
        document.getElementById("filterYear").value
    );
    const q = query(
        collection(db, "attendance"),
        where("bulan", "==", bulan),
        where("tahun", "==", tahun)
    );
    const snap = await getDocs(q);
    let attendanceData = [];
    snap.forEach(doc => {
        attendanceData.push(doc.data());

    });
    // SORT TANGGAL TERLAMA KE TERBARU
    attendanceData.sort((a, b) => {
        return a.tanggal.localeCompare(b.tanggal);
    });
    attendanceData.forEach(d => {
        // FORMAT YYYY-MM-DD menjadi DD/MM/YYYY
        const bagianTanggal = d.tanggal.split("-");
        const tanggal =
            `${bagianTanggal[2]}/${bagianTanggal[1]}/${bagianTanggal[0]}`;
        tbody.innerHTML += `
<tr>
<td>${tanggal}</td>
<td>${d.kodeKaryawan}</td>
<td>${d.namaKaryawan}</td>
<td>${d.jabatan}</td>
<td>${d.status}</td>
</tr>
`;
    });
};

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
        "August",
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
    let attendanceData = [];
    snap.forEach(doc => {
        attendanceData.push(doc.data());
    });

    // SORT TANGGAL TERLAMA KE TERBARU
    attendanceData.sort((a, b) => {
        return a.tanggal.localeCompare(b.tanggal);
    });
    attendanceData.forEach(d => {
        // FORMAT YYYY-MM-DD menjadi DD/MM/YYYY
        const pecahTanggal = d.tanggal.split("-");
        const tanggal =
            `${pecahTanggal[2]}/${pecahTanggal[1]}/${pecahTanggal[0]}`;
        tbody.innerHTML += `
<tr>
<td>${tanggal}</td>
<td>${d.kodeKaryawan}</td>
<td>${d.namaKaryawan}</td>
<td>${d.jabatan}</td>
<td>${d.status}</td>
</tr>
`;
    });
}

/* DATA SALARY */
const salaryConfig = {
    potonganAlpha: 10000
};

window.showSalary = () => {
    const bulanSekarang = new Date().getMonth() + 1;
    const tahunSekarang = new Date().getFullYear();

    document.getElementById("content").innerHTML = `
<div class="card">
<h2>Generate Salary</h2>
<div class="attendance-form-grid">
<div class="form-group">
<label>Month</label>
<select id="salaryMonth"></select>
</div>
<div class="form-group">
<label>Year</label>
<select id="salaryYear"></select>
</div>
<div class="form-group button-align">
<label>&nbsp;</label>
<button onclick="generateSalary()">
Generate Salary
</button>
</div>
</div>
<br>
<div class="table-container">
<table>
<thead>
<tr>
<th>ID Employee</th>
<th>Name</th>
<th>Jobs</th>
<th>Present</th>
<th>Permit</th>
<th>Leave</th>
<th>Alpha</th>
<th>Basic Salary</th>
<th>Position Allowance</th>
<th>Other Allowance</th>
<th>Attendance Deduction</th>
<th>Cooperative Deduction</th>
<th>Total Salary</th>
</tr>
</thead>
<tbody id="salaryTable"></tbody>
</table>
</div>
<br>
<button onclick="submitAllSalary()">
Submit Salary
</button>
</div>
<div class="card">
<h2>Salary History</h2>
<div class="attendance-form-grid">
<div class="form-group">
<label>Month</label>
<select id="salaryHistoryMonth"></select>
</div>
<div class="form-group">
<label>Year</label>
<select id="salaryHistoryYear"></select>
</div>
<div class="form-group button-align">
<label>&nbsp;</label>
<button onclick="loadSalaryHistory()">
Search
</button>
</div>
</div>
<br>
<div class="table-container">
<table>
<thead>
<tr>
<th>ID Employee</th>
<th>Name</th>
<th>Jobs</th>
<th>Month</th>
<th>Year</th>
<th>Total Salary</th>
<th>Status</th>
<th>Action</th>
</tr>
</thead>
<tbody id="salaryHistoryTable"></tbody>
</table>
</div>
</div>
`;

    fillSalaryMonthYear(
        "salaryMonth",
        "salaryYear",
        bulanSekarang,
        tahunSekarang
    );

    fillSalaryMonthYear(
        "salaryHistoryMonth",
        "salaryHistoryYear",
        bulanSekarang,
        tahunSekarang
    );
};


function fillSalaryMonthYear(monthId, yearId, monthNow, yearNow) {

    const month = document.getElementById(monthId);
    const year = document.getElementById(yearId);

    const namaBulan = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    month.innerHTML = "";

    namaBulan.forEach((m, i) => {
        month.innerHTML += `
<option value="${i + 1}" ${monthNow == i + 1 ? "selected" : ""}>
${m}
</option>`;
    });

    year.innerHTML = "";

    for (let y = yearNow - 3; y <= yearNow + 2; y++) {
        year.innerHTML += `
<option value="${y}" ${yearNow == y ? "selected" : ""}>
${y}
</option>`;
    }
}
window.generateSalary = async () => {
    const bulan = Number(document.getElementById("salaryMonth").value);
    const tahun = Number(document.getElementById("salaryYear").value);
    const tbody = document.getElementById("salaryTable");

    tbody.innerHTML = `
<tr>
<td colspan="13">
Loading...
</td>
</tr>`;

    try {
        const employeeSnap = await getDocs(
            collection(db, "employees")
        );

        const attendanceSnap = await getDocs(
            collection(db, "attendance")
        );

        let attendance = [];

        attendanceSnap.forEach(doc => {
            const d = doc.data();

            if (
                Number(d.bulan) == bulan &&
                Number(d.tahun) == tahun
            ) {
                attendance.push(d);
            }
        });

        let html = "";

        employeeSnap.forEach(doc => {
            const emp = doc.data();

            let hadir = 0;
            let izin = 0;
            let cuti = 0;
            let alpha = 0;

            attendance.forEach(att => {
                if (att.kodeKaryawan == emp.kodeKaryawan) {

                    if (att.status == "Hadir") {
                        hadir++;
                    }
                    else if (att.status == "Izin") {
                        izin++;
                    }
                    else if (att.status == "Cuti") {
                        cuti++;
                    }
                    else if (
                        att.status == "Alpha" ||
                        att.status == "Tidak Hadir"
                    ) {
                        alpha++;
                    }
                }
            });

            const potongan =
                alpha * salaryConfig.potonganAlpha;


            html += `
<tr>
<td>${emp.kodeKaryawan}</td>
<td>${emp.namaKaryawan}</td>
<td>${emp.jabatan}</td>
<td>${hadir}</td>
<td>${izin}</td>
<td>${cuti}</td>
<td>${alpha}</td>

<td>
<input 
type="number"
id="basic_${emp.kodeKaryawan}"
value="0"
onchange="calculateSalary('${emp.kodeKaryawan}')">
</td>

<td>
<input 
type="number"
id="jabatan_${emp.kodeKaryawan}"
data-nama="${emp.jabatan}"
value="0"
onchange="calculateSalary('${emp.kodeKaryawan}')">
</td>

<td>
<input 
type="number"
id="lain_${emp.kodeKaryawan}"
value="0"
onchange="calculateSalary('${emp.kodeKaryawan}')">
</td>

<td>
<input
readonly
type="number"
id="potongan_${emp.kodeKaryawan}"
value="${potongan}">
</td>

<td>
<input
readonly
type="number"
id="koperasi_${emp.kodeKaryawan}"
value="0">
</td>

<td>
<span id="total_${emp.kodeKaryawan}">
0
</span>
</td>

<input 
type="hidden"
id="bulan_${emp.kodeKaryawan}"
value="${bulan}">

<input 
type="hidden"
id="tahun_${emp.kodeKaryawan}"
value="${tahun}">

<input 
type="hidden"
id="nama_${emp.kodeKaryawan}"
value="${emp.namaKaryawan}">

<input 
type="hidden"
id="hadir_${emp.kodeKaryawan}"
value="${hadir}">

<input 
type="hidden"
id="izin_${emp.kodeKaryawan}"
value="${izin}">

<input 
type="hidden"
id="cuti_${emp.kodeKaryawan}"
value="${cuti}">

<input 
type="hidden"
id="alpha_${emp.kodeKaryawan}"
value="${alpha}">

</tr>
`;
        });

        tbody.innerHTML = html;

    }
    catch (error) {
        console.error(error);
        alert(error.message);
    }
};
window.calculateSalary = (kode) => {
    const basic =
        Number(
            document.getElementById(`basic_${kode}`).value
        ) || 0;

    const jabatan =
        Number(
            document.getElementById(`jabatan_${kode}`).value
        ) || 0;

    const lain =
        Number(
            document.getElementById(`lain_${kode}`).value
        ) || 0;

    const potongan =
        Number(
            document.getElementById(`potongan_${kode}`).value
        ) || 0;

    const koperasi =
        Number(
            document.getElementById(`koperasi_${kode}`).value
        ) || 0;

    const total =
        basic +
        jabatan +
        lain -
        potongan -
        koperasi;
    document.getElementById(`total_${kode}`).innerHTML =
        total.toLocaleString("id-ID");
};

window.submitAllSalary = async () => {
    try {
        const rows = document.querySelectorAll(
            "#salaryTable tr"
        );
        if (rows.length == 0) {
            alert(
                "Generate salary terlebih dahulu"
            );
            return;
        }
        for (const row of rows) {
            const input = row.querySelector(
                "input[id^='basic_']"
            );
            if (!input) {
                continue;
            }
            const kode =
                input.id.replace(
                    "basic_",
                    ""
                );
            const data = {
                bulan: Number(
                    document.getElementById(
                        `bulan_${kode}`
                    ).value
                ),
                tahun: Number(
                    document.getElementById(
                        `tahun_${kode}`
                    ).value
                ),
                kodeKaryawan: kode,
                namaKaryawan:
                    document.getElementById(
                        `nama_${kode}`
                    ).value,
                jabatan:
                    document.getElementById(`jabatan_${kode}`).dataset.nama || "",
                hadir: Number(
                    document.getElementById(
                        `hadir_${kode}`
                    ).value
                ),
                izin: Number(
                    document.getElementById(
                        `izin_${kode}`
                    ).value
                ),
                cuti: Number(
                    document.getElementById(
                        `cuti_${kode}`
                    ).value
                ),
                alpha: Number(
                    document.getElementById(
                        `alpha_${kode}`
                    ).value
                ),
                gajiPokok: Number(
                    document.getElementById(
                        `basic_${kode}`
                    ).value
                ) || 0,
                tunjanganJabatan: Number(
                    document.getElementById(
                        `jabatan_${kode}`
                    ).value
                ) || 0,
                tunjanganLainnya: Number(
                    document.getElementById(
                        `lain_${kode}`
                    ).value
                ) || 0,
                potonganKehadiran: Number(
                    document.getElementById(
                        `potongan_${kode}`
                    ).value
                ) || 0,
                potonganKoperasi: Number(
                    document.getElementById(
                        `koperasi_${kode}`
                    ).value
                ) || 0,
                totalGaji: Number(
                    document.getElementById(
                        `total_${kode}`
                    ).innerText
                        .replace(/\./g, "")
                ) || 0,
                status: "Paid",
                tanggal: new Date()

            };

            const idSalary =
                `${data.tahun}-${data.bulan}-${data.kodeKaryawan}`;
            await setDoc(
                doc(
                    db,
                    "salary",
                    idSalary
                ),
                data
            );
        }
        alert(
            "Semua salary berhasil disimpan"
        );

        document.getElementById("salaryTable").innerHTML = "";
    }
    catch (error) {
        console.error(error);
        alert(error.message);
    }
};

window.loadSalaryHistory = async () => {
    const bulan = Number(
        document.getElementById("salaryHistoryMonth").value
    );
    const tahun = Number(
        document.getElementById("salaryHistoryYear").value
    );
    const tbody =
        document.getElementById("salaryHistoryTable");

    tbody.innerHTML = `
<tr>
<td colspan="8">
Loading...
</td>
</tr>`;

    try {

        const q = query(
            collection(db, "salary"),
            where("bulan", "==", bulan),
            where("tahun", "==", tahun)
        );

        const snap = await getDocs(q);
        tbody.innerHTML = "";
        if (snap.empty) {

            tbody.innerHTML = `
<tr>
<td colspan="8">
Belum ada data salary
</td>
</tr>`;

            return;

        }

        /* ambil data employee untuk jabatan */
        const employeeSnap = await getDocs(
            collection(db, "employees")
        );

        let employeeData = {};
        employeeSnap.forEach(emp => {
            const e = emp.data();
            employeeData[e.kodeKaryawan] = e.jabatan;

        });

        const namaBulan = [
            "",
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];

        snap.forEach(doc => {
            const d = doc.data();
            const jabatan =
                d.jabatan ||
                employeeData[d.kodeKaryawan] ||
                "-";


            tbody.innerHTML += `
<tr>
<td>
${d.kodeKaryawan}
</td>
<td>
${d.namaKaryawan}
</td>
<td>
${jabatan}
</td>
<td>
${namaBulan[d.bulan]}
</td>
<td>
${d.tahun}
</td>
<td>
${Number(
                d.totalGaji || 0
            ).toLocaleString("id-ID")}
</td>
<td>
${d.status || "-"}
</td>
<td>
<button onclick="printSalaryPDF('${doc.id}')">
Print PDF
</button>
</td>
</tr>
`;

        });
    }
    catch (error) {
        console.error(error);
        alert(error.message);
    }
};

/* =====================
  PDF PRINT SLIP SALARY
  ===================== */
window.printSalaryPDF = async (id) => {
    try {
        const ref = doc(
            db,
            "salary",
            id
        );

        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) {
            alert("Data salary tidak ditemukan");
            return;
        }

        const d = snapshot.data();
        const { jsPDF } = window.jspdf;

        const grossSalary =
            Number(d.gajiPokok || 0) +
            Number(d.tunjanganJabatan || 0) +
            Number(d.tunjanganLainnya || 0);

        const totalPotongan =
            Number(d.potonganKehadiran || 0) +
            Number(d.potonganKoperasi || 0);

        const takeHomePay =
            grossSalary - totalPotongan;

        let hadir = 0;
        let izin = 0;
        let sakit = 0;
        let cuti = 0;
        let alpha = 0;

        const attendanceQuery = query(
            collection(db, "attendance"),
            where("kodeKaryawan", "==", d.kodeKaryawan),
            where("bulan", "==", Number(d.bulan)),
            where("tahun", "==", Number(d.tahun))
        );

        const attendanceSnap = await getDocs(attendanceQuery);
        attendanceSnap.forEach(item => {
            const a = item.data();

            if (a.status == "Hadir") {
                hadir++;
            }
            else if (a.status == "Izin") {
                izin++;
            }
            else if (a.status == "Sakit") {
                sakit++;
            }
            else if (a.status == "Cuti") {
                cuti++;
            }
            else if (a.status == "Alpha" || a.status == "Tidak Hadir") {
                alpha++;
            }
        });

        const pdf = new jsPDF();
        /* =====================
           KONFIGURASI PERUSAHAAN
        ===================== */
        const namaPerusahaan = "PT. NAMA PERUSAHAAN";
        const alamatPerusahaan = "Jl. Contoh Alamat Perusahaan No. 123, Indonesia";
        const logoURL = "https://link-gambar-logo-perusahaan.com/logo.png";

        /* =====================
           LOAD LOGO
        ===================== */
        try {
            const logo = await loadImageBase64(logoURL);
            pdf.addImage(logo, "PNG", 15, 10, 25, 25);
        }
        catch (e) {
            console.log(
                "Logo gagal dimuat"
            );
        }

        /* =====================
        HEADER
        ===================== */
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.text(namaPerusahaan, 45, 16);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(alamatPerusahaan, 45, 23);

        pdf.setLineWidth(0.8);
        pdf.line(15, 32, 195, 32);

        pdf.setLineWidth(0.2);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");

        pdf.text("SLIP GAJI KARYAWAN", 115, 40, {
            align: "center"
        });

        /* =====================
           DATA KARYAWAN
        ===================== */
        pdf.setFillColor(240, 240, 240);
        pdf.line(15, 47, 195, 47);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`ID Karyawan : ${d.kodeKaryawan}`, 25, 56);
        pdf.text(`Nama : ${d.namaKaryawan}`, 25, 64);
        pdf.text(`Jabatan : ${d.jabatan || "-"}`, 25, 72);
        pdf.text(`Periode : ${getNamaBulan(d.bulan)} ${d.tahun}`, 120, 56);
        pdf.text(`Status : ${d.status}`, 120, 64);

        /* =====================
           DATA KEHADIRAN TABLE
        ===================== */
        let y = 82;
        pdf.setFont("helvetica", "bold");
        pdf.text("DATA KEHADIRAN", 20, y);

        y += 8;
        /* HEADER TABEL */
        pdf.setFillColor(230, 230, 230);
        pdf.rect(20, y, 170, 10, "F");
        pdf.setFontSize(10);
        pdf.text("Hadir", 30, y + 7);
        pdf.text("Izin", 65, y + 7);
        pdf.text("Sakit", 95, y + 7);
        pdf.text("Cuti", 125, y + 7);
        pdf.text("Alpha", 160, y + 7);

        /* NILAI */
        y += 10;
        pdf.rect(20, y, 170, 10);
        pdf.setFont("helvetica", "normal");
        pdf.text(String(hadir), 35, y + 7);
        pdf.text(String(izin), 70, y + 7);
        pdf.text(String(sakit), 100, y + 7);
        pdf.text(String(cuti), 130, y + 7);
        pdf.text(String(alpha), 165, y + 7);

        /* GARIS PEMBATAS KOLOM */
        pdf.line(55, y, 55, y + 10);
        pdf.line(85, y, 85, y + 10);
        pdf.line(115, y, 115, y + 10);
        pdf.line(150, y, 150, y + 10);

        /* =====================
         PENDAPATAN
         ===================== */
        y += 20;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("PENDAPATAN", 20, y);
        pdf.setFont("helvetica", "normal");

        y += 12;
        pdf.text("Gaji Pokok", 25, y);
        pdf.setFillColor(220, 245, 220);
        pdf.rect(90, y - 6, 50, 10, "F");
        pdf.text("Rp", 105, y);
        pdf.text(formatNominal(d.gajiPokok), 140, y, { align: "right" });

        y += 10;
        pdf.text("Tunjangan Jabatan", 25, y);
        pdf.setFillColor(220, 245, 220);
        pdf.rect(90, y - 6, 50, 10, "F");
        pdf.text("Rp", 105, y);
        pdf.text(formatNominal(d.tunjanganJabatan), 140, y, { align: "right" });

        y += 10;
        pdf.text("Tunjangan Lainnya", 25, y);
        pdf.setFillColor(220, 245, 220);
        pdf.rect(90, y - 6, 50, 10, "F");
        pdf.text("Rp", 105, y);
        pdf.text(formatNominal(d.tunjanganLainnya), 140, y, { align: "right" });
        pdf.setFont("helvetica", "bold");
        pdf.text("+", 190, y);

        y += 8;
        pdf.setDrawColor(30, 150, 80);
        pdf.setLineWidth(0.8);
        pdf.line(15, y, 195, y);

        y += 8;
        pdf.setFillColor(190, 235, 190);
        pdf.rect(140, y - 6, 50, 10, "F");
        pdf.text("Gross Salary", 25, y);
        pdf.text("Rp", 120, y);
        pdf.text(formatNominal(grossSalary), 190, y, { align: "right" });

        y += 8;
        pdf.line(15, y, 195, y);
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.2);

        /* =====================
        POTONGAN
        ===================== */
        y += 12;
        pdf.setFont("helvetica", "bold");
        pdf.text("POTONGAN", 20, y);
        pdf.setFont("helvetica", "normal");

        y += 12;
        pdf.text("Potongan Kehadiran", 25, y);
        pdf.setFillColor(255, 220, 220);
        pdf.rect(90, y - 6, 60, 10, "F");
        pdf.text("Rp", 105, y);
        pdf.text(formatNominal(d.potonganKehadiran), 140, y, { align: "right" });

        y += 10;
        pdf.text("Potongan Koperasi", 25, y);
        pdf.setFillColor(255, 220, 220);
        pdf.rect(90, y - 6, 60, 10, "F");
        pdf.text("Rp", 105, y);
        pdf.text(formatNominal(d.potonganKoperasi), 140, y, { align: "right" });

        pdf.setFont("helvetica", "bold");
        pdf.text("+", 190, y);

        y += 8;
        pdf.setDrawColor(30, 150, 80);
        pdf.setLineWidth(0.8);
        pdf.line(15, y, 195, y);

        y += 8;
        pdf.setFillColor(255, 210, 210);
        pdf.rect(140, y - 6, 100, 10, "F");
        pdf.text("Total Potongan", 25, y);
        pdf.text("Rp", 120, y);
        pdf.text(
            formatNominal(totalPotongan),
            190,
            y,
            {
                align: "right"
            }
        );

        y += 8;

        pdf.line(15, y, 195, y);

        pdf.setDrawColor(0);
        pdf.setLineWidth(0.2);

        /* =====================
        TAKE HOME PAY
        ===================== */

        y += 20;

        pdf.setDrawColor(30, 100, 220);
        pdf.setLineWidth(1);

        pdf.line(15, y - 10, 195, y - 10);
        pdf.line(15, y + 10, 195, y + 10);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);

        pdf.text(
            "TAKE HOME PAY",
            25,
            y + 2
        );

        pdf.setFillColor(180, 230, 180);
        pdf.rect(140, y - 7, 50, 11, "F");
    
        pdf.text("Rp", 120, y);
        pdf.text(
            formatNominal(takeHomePay),
            190,
            y + 2,
            {
                align: "right"
            }
        );

        pdf.setLineWidth(0.2);
        pdf.setDrawColor(0);

        const namaBulan =
            getNamaBulan(d.bulan);
        pdf.save(
            `Slip Salary ${d.kodeKaryawan} ${d.namaKaryawan} ${namaBulan} ${d.tahun}.pdf`
        );
    }
    catch (error) {
        console.error(error);
        alert(
            error.message
        );
    }
};

function formatNominal(value) {
    return Number(value || 0).toLocaleString("id-ID");
}
function getNamaBulan(bulan) {
    const bulanArray = [
        "", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return bulanArray[bulan] || "";
}

function loadImageBase64(url) {
    return new Promise(
        (resolve, reject) => {
            const img =
                new Image();
            img.crossOrigin =
                "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(
                    img,
                    0,
                    0
                );

                resolve(
                    canvas.toDataURL(
                        "image/png"
                    )
                );

            };

            img.onerror = reject;
            img.src = url;
        }
    );
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

/* Link Admin */
window.goToAdmin = function () {
    window.open("https://s.id/atrisna", "_blank");
};

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
