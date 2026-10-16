import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore, collection, getDocs, getDoc, addDoc, doc, setDoc, deleteDoc, updateDoc, writeBatch, orderBy, query, where} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
<div class="card" style="border-left:5px solid #d97706;margin-bottom:16px;line-height:1.6">
<strong>Mode Audit & Pengujian</strong><br>
Versi ini sedang diaudit. Angka dashboard diambil dari Firestore; validasi payroll, hak akses per peran, laporan lengkap, dan backup harus dituntaskan serta diuji sebelum digunakan untuk operasional keuangan.
</div>
<div class="kpi-container">

<div class="kpi-card blue">
<h4>Total Employees</h4>
<h1>—</h1>
<span>Employee Active</span>
</div>

<div class="kpi-card green">
<h4>Today Attendance</h4>
<h1>—</h1>
<span>Present</span>
</div>

<div class="kpi-card orange">
<h4>Late Arrival</h4>
<h1>—</h1>
<span>Late Employee</span>
</div>

<div class="kpi-card purple">
<h4>New Employees</h4>
<h1>—</h1>
<span>This Month</span>
</div>

<div class="kpi-card red">
<h4>Job Categories</h4>
<h1>—</h1>
<span>Total Division</span>
</div>
</div>

<div class="chart-grid">
<div class="card chart-box">
<h3>Gender Employee</h3>
<canvas id="genderChart"></canvas>
</div>

<div class="card chart-box">
<h3>Monthly Attendance (Data Firestore)</h3>
<canvas id="attendanceChart"></canvas>
</div>

<div class="card chart-box">
<h3>Employees by Job</h3>
<canvas id="departmentChart"></canvas>
</div>

<div class="card chart-box">
<h3>Attendance Status</h3>
<canvas id="statusChart"></canvas>
</div>

<div class="card chart-box">
<h3>Employee Status</h3>
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
                    refreshDashboardKPI();

                };

                async function refreshDashboardKPI() {
                    try {
                        const [employeeSnap, attendanceSnap] = await Promise.all([
                            getDocs(collection(db, "employees")),
                            getDocs(collection(db, "attendance"))
                        ]);
                        const employees = [];
                        employeeSnap.forEach(item => employees.push(item.data()));
                        const activeEmployees = employees.filter(e => !e.status || e.status === "Active");
                        const departments = new Set(employees.map(e => String(e.jabatan || "").trim()).filter(Boolean));
                        const now = new Date();
                        const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
                        const currentMonth = employees.filter(e => String(e.tanggalMulaiKerja || "").slice(0, 7) === today.slice(0, 7)).length;
                        let hadir = 0, terlambat = 0, recordedToday = 0;
                        attendanceSnap.forEach(item => {
                            const d = item.data();
                            if (d.tanggal === today) {
                                recordedToday++;
                                if (String(d.status || "").toLowerCase() === "hadir") hadir++;
                                if (String(d.status || "").toLowerCase().includes("terlambat")) terlambat++;
                            }
                        });
                        const percentage = activeEmployees.length ? Math.round((hadir / activeEmployees.length) * 100) : 0;
                        const values = [activeEmployees.length, percentage + "%", terlambat, currentMonth, departments.size];
                        document.querySelectorAll(".kpi-card h1").forEach((el, i) => {
                            if (values[i] !== undefined) el.textContent = values[i];
                        });
                        const attendanceNote = document.querySelector(".kpi-card.green span");
                        if (attendanceNote) attendanceNote.textContent = `Hadir hari ini: ${hadir} / ${activeEmployees.length}`;
                        const lateNote = document.querySelector(".kpi-card.orange span");
                        if (lateNote) lateNote.textContent = `Tercatat hari ini: ${recordedToday}`;
                    } catch (error) {
                        console.error("Dashboard KPI tidak dapat diperbarui:", error);
                    }
                }

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
<option value="Lainnya">Other</option>
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
                                alert("Please fill in all employee data first!");
                                if (el) el.focus();
                                return;
                            }
                        }

                        if (document.getElementById("kode").value == "") {
                            alert("Please select the Start Date first!");
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
                            status: "Active",
                            foto: ""
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

                        alert("Data saved successfully.");
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
                    if (confirm("Delete employee data?")) {
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
                        <th>ID Employee</th>
                        <th>Employee Name</th>
                        <th>Gender</th>
                        <th>Jobs</th>
                        <th>Start Work Date</th>
                        <th>Contact</th>
                        <th>Action</th>
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
        class="view-btn" 
        onclick="viewEmployee('${docSnap.id}')">
        View
        </button>

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
                window.viewEmployee = async (id) => {
                    const snap = await getDoc(
                        doc(db, "employees", id)
                    );
                    const d = snap.data();
                    const content = document.getElementById("content");
                    content.innerHTML = `
<div class="card">
<h2>Employee Biodata</h2>
<div style="
display:flex;
gap:30px;
align-items:flex-start;
margin-top:30px;
">
<div>
<img
id="fotoPreview" 
src="${d.foto || 'https://via.placeholder.com/150'}"
style="
width:150px;
height:150px;
object-fit:cover;
border-radius:10px;
">
<br><br>
<input 
type="file"
id="uploadFoto"
accept="image/*"
onchange="previewFoto(event)">
<br><br>
<button onclick="uploadEmployeePhoto('${id}')">
Upload Photo
</button>
</div>
<div>
<h2>${d.namaKaryawan}</h2>
<div class="biodata">
<p><b>ID</b><span>:</span>${d.kodeKaryawan}</p>
<p><b>Jobs</b><span>:</span>${d.jabatan}</p>
<p><b>Gender</b><span>:</span>${d.jenisKelamin}</p>
<p><b>Birthday</b><span>:</span>${d.tanggalLahir}</p>
<p><b>Address</b><span>:</span>${d.alamat}</p>
<p><b>Education</b><span>:</span>${d.pendidikanTerakhir}</p>
<p><b>Contact</b><span>:</span>${d.noHp}</p>
<p><b>Bank</b><span>:</span>${d.bank}</p>
<p><b>Account</b><span>:</span>${d.nomorRekening}</p>
<p><b>Start Work</b><span>:</span>${d.tanggalMulaiKerja}</p>
</div>
<br>
<button class="back-btn" onclick="showDataEmployee()">
⬅ Back to Data Employee
</button>
</div>
</div>
</div>
`;
                }
                window.previewFoto = (event) => {
                    const img = document.getElementById("fotoPreview");
                    img.src = URL.createObjectURL(
                        event.target.files[0]
                    );

                }
                window.uploadEmployeePhoto = async (id) => {
                    const file =
                        document.getElementById("uploadFoto").files[0];
                    if (!file) {
                        alert("Please select a photo first!");
                        return;
                    }
                    if (file.size > 500000) {
                        alert("Maximum photo size 500 KB");
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = async function () {
                        const imageBase64 = reader.result;
                        await updateDoc(
                            doc(db, "employees", id),
                            {
                                foto: imageBase64
                            }
                        );
                        alert("Photo saved successfully");
                        viewEmployee(id);
                    };
                    reader.readAsDataURL(file);
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
<th>Action</th>
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
Search
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
                    select.innerHTML = ` <option value="">-- Select Employee -- </option>`;

                    const snap = await getDocs(
                        collection(db, "employees")
                    );

                    let employees = [];
                    snap.forEach(doc => {
                        const d = doc.data();
                        // hanya ambil employee Active
                        if (!d.status || d.status == "Active") {

                            employees.push({
                                id: doc.id,
                                ...d
                            });
                        }
                    });

                    employees.sort((a, b) => {
                        return String(a.kodeKaryawan).localeCompare(
                            String(b.kodeKaryawan),
                            undefined,
                            {
                                numeric: true,
                                sensitivity: "base"
                            }
                        );
                    });

                    employees.forEach(emp => {

                        select.innerHTML += `
        <option value="${emp.id}">
            ${emp.kodeKaryawan} - ${emp.namaKaryawan}
        </option>
        `;
                    });
                }

                window.addAttendanceRow = async () => {
                    const tanggal = document.getElementById("attendanceDate").value;
                    const id = document.getElementById("employeeSelect").value;

                    // VALIDASI TANGGAL
                    if (!tanggal) {
                        alert("Please select the date of absence first!");
                        document.getElementById("attendanceDate").focus();
                        return;
                    }
                    // VALIDASI KARYAWAN
                    if (!id) {
                        alert("Please select employees first!");
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
                                alert("This employee has been added!");
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
                        alert("There is no attendance data yet.");
                        return;
                    }

                    try {
                        const dates = [...new Set(attendanceTemp.map(d => d.tanggal))];
                        if (dates.some(d => !d)) {
                            alert("Ada data absensi tanpa tanggal. Periksa kembali.");
                            return;
                        }
                        // Periksa data existing pada tanggal terkait agar submit ulang tidak menggandakan absensi.
                        const existingByDate = new Map();
                        for (const date of dates) {
                            const existingSnap = await getDocs(query(collection(db, "attendance"), where("tanggal", "==", date)));
                            existingByDate.set(date, new Set(existingSnap.docs.map(x => String(x.data().kodeKaryawan || ""))));
                        }
                        const duplicates = attendanceTemp.filter(d => existingByDate.get(d.tanggal)?.has(String(d.kode || "")));
                        if (duplicates.length) {
                            const detail = duplicates.map(d => `${d.kode} (${d.tanggal})`).join(", ");
                            alert(`Absensi tidak disimpan karena sudah ada data untuk karyawan/tanggal berikut: ${detail}. Periksa Data Attendance terlebih dahulu.`);
                            return;
                        }
                        if (attendanceTemp.length > 450) {
                            alert("Jumlah baris melebihi batas aman untuk satu proses. Bagi data menjadi beberapa kelompok.");
                            return;
                        }
                        const batch = writeBatch(db);
                        for (const d of attendanceTemp) {
                            const [year, month] = d.tanggal.split("-").map(Number);
                            const attendanceRef = doc(collection(db, "attendance"));
                            batch.set(attendanceRef, {
                                tanggal: d.tanggal,
                                bulan: month,
                                tahun: year,
                                kodeKaryawan: d.kode,
                                namaKaryawan: d.nama,
                                jabatan: d.jabatan,
                                status: d.status,
                                dibuatOleh: auth.currentUser?.uid || "unknown",
                                createdAt: new Date()
                            });
                        }
                        await batch.commit();
                    } catch (error) {
                        console.error("Gagal menyimpan absensi:", error);
                        alert("Absensi gagal disimpan. Periksa koneksi dan aturan Firestore. Detail: " + error.message);
                        return;
                    }

                    alert("Absensi berhasil disimpan.");
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
<h2>Payroll & Slip Gaji</h2>
<p>Komponen upah akan diisi awal dari data karyawan/kontrak bila tersedia. Periksa dan sesuaikan sebelum menyimpan payroll sebagai Draft.</p>
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
<th>Upah Pokok</th>
<th>Tunjangan Jabatan</th>
<th>Tunjangan Lainnya</th>
<th>Potongan Absensi</th>
<th>Potongan Koperasi</th>
<th>Total Gaji</th>
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

                        let employees = [];
                        employeeSnap.forEach(doc => {
                            const emp = doc.data();
                            if (emp.status == "Active") {
                                employees.push(emp);
                            }
                        });

                        employees.sort((a, b) => {
                            return String(a.kodeKaryawan).localeCompare(
                                String(b.kodeKaryawan),
                                undefined,
                                {
                                    numeric: true,
                                    sensitivity: "base"
                                }
                            );
                        });

                        let html = "";

                        employees.forEach(emp => {

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
value="${Number(emp.upahPokokBulanan ?? emp.gajiPokok ?? emp.upahPokok ?? 0) || 0}"
onchange="calculateSalary('${emp.kodeKaryawan}')">
</td>

<td>
<input 
type="number"
id="jabatan_${emp.kodeKaryawan}"
data-nama="${emp.jabatan}"
value="${Number(emp.tunjanganJabatan ?? 0) || 0}"
onchange="calculateSalary('${emp.kodeKaryawan}')">
</td>

<td>
<input 
type="number"
id="lain_${emp.kodeKaryawan}"
value="${Number(emp.tunjanganBulanan ?? emp.totalTunjangan ?? emp.tunjanganLainnya ?? emp.tunjangan ?? 0) || 0}"
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
                        // Calculate totals immediately so contract-based default pay values are reflected before manual edits.
                        employees.forEach(emp => {
                            if (emp.kodeKaryawan != null) window.calculateSalary(emp.kodeKaryawan);
                        });

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
                        const rows = [...document.querySelectorAll("#salaryTable tr")];
                        if (!rows.length || !rows.some(row => row.querySelector("input[id^='basic_']"))) {
                            alert("Buat perhitungan payroll terlebih dahulu.");
                            return;
                        }
                        const payrollRows = [];
                        for (const row of rows) {
                            const input = row.querySelector("input[id^='basic_']");
                            if (!input) continue;
                            const kode = input.id.replace("basic_", "");
                            const getValue = suffix => document.getElementById(`${suffix}_${kode}`)?.value;
                            const gajiPokok = Number(getValue("basic")) || 0;
                            const tunjanganJabatan = Number(getValue("jabatan")) || 0;
                            const tunjanganLainnya = Number(getValue("lain")) || 0;
                            const potonganKehadiran = Number(getValue("potongan")) || 0;
                            const potonganKoperasi = Number(getValue("koperasi")) || 0;
                            const totalGaji = gajiPokok + tunjanganJabatan + tunjanganLainnya - potonganKehadiran - potonganKoperasi;
                            if (totalGaji < 0) {
                                alert(`Total gaji untuk ${kode} tidak boleh negatif. Periksa gaji dan potongan.`);
                                return;
                            }
                            const bulan = Number(getValue("bulan"));
                            const tahun = Number(getValue("tahun"));
                            payrollRows.push({
                                id: `${tahun}-${bulan}-${kode}`,
                                data: {
                                    bulan, tahun, kodeKaryawan: kode,
                                    namaKaryawan: getValue("nama") || "",
                                    jabatan: document.getElementById(`jabatan_${kode}`)?.dataset.nama || "",
                                    hadir: Number(getValue("hadir")) || 0,
                                    izin: Number(getValue("izin")) || 0,
                                    cuti: Number(getValue("cuti")) || 0,
                                    alpha: Number(getValue("alpha")) || 0,
                                    gajiPokok, tunjanganJabatan, tunjanganLainnya,
                                    potonganKehadiran, potonganKoperasi, totalGaji,
                                    status: "Draft",
                                    tanggal: new Date(),
                                    dibuatOleh: auth.currentUser?.uid || "unknown"
                                }
                            });
                        }
                        if (!payrollRows.length) {
                            alert("Tidak ada baris payroll valid untuk disimpan.");
                            return;
                        }
                        if (payrollRows.length > 450) {
                            alert("Jumlah karyawan terlalu banyak untuk satu batch. Bagi proses payroll menjadi beberapa kelompok.");
                            return;
                        }
                        // Preflight semua dokumen terlebih dahulu agar tidak terjadi simpan sebagian jika ada ID yang sudah ada.
                        const existing = [];
                        for (const row of payrollRows) {
                            const snap = await getDoc(doc(db, "salary", row.id));
                            if (snap.exists()) existing.push(row.data.kodeKaryawan);
                        }
                        if (existing.length) {
                            alert(`Payroll tidak disimpan karena data untuk periode ini sudah ada bagi: ${existing.join(", ")}. Tidak ada data yang diubah. Periksa riwayat payroll terlebih dahulu.`);
                            return;
                        }
                        const batch = writeBatch(db);
                        payrollRows.forEach(row => batch.set(doc(db, "salary", row.id), row.data));
                        await batch.commit();
                        alert("Draft payroll berhasil disimpan. Status masih Draft dan belum berarti gaji sudah dibayarkan.");
                        document.getElementById("salaryTable").innerHTML = "";
                        await loadSalaryHistory();
                    } catch (error) {
                        console.error("Gagal menyimpan draft payroll:", error);
                        alert("Draft payroll gagal disimpan. Tidak boleh dianggap sudah dibayar. Detail: " + error.message);
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
                            alert("Salary data not found");
                            return;
                        }

                        const d = snapshot.data();
                        const {jsPDF} = window.jspdf;

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
                        const namaPerusahaan = "JEFFAN INTERNATIONAL";
                        const alamatPerusahaan = "1307 E. Main St, ste 1 Chattanooga, TN 37404";
                        const logoURL = "https://raw.githubusercontent.com/JeffanInd/Dashboar-Attendance/main/logo.jpg";

                        /* =====================
                           LOAD LOGO
                        ===================== */
                        try {
                            const logo = await loadImageBase64(logoURL);
                            pdf.addImage(logo, "JPEG", 15, 10, 18, 18);
                        } catch (e) {
                            console.error("Logo gagal dimuat:", e);
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

                        pdf.text("PAY SLIP EMPLOYEE", 110, 40, {
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
                        pdf.text("ATTENDANCE DATA", 20, y);

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
                        pdf.text("INCOME", 20, y);
                        pdf.setFont("helvetica", "normal");

                        y += 12;
                        pdf.text("Basic salary", 25, y);
                        pdf.setFillColor(220, 245, 220);
                        pdf.rect(90, y - 6, 50, 10, "F");
                        pdf.text("Rp", 100, y);
                        pdf.text(formatNominal(d.gajiPokok), 140, y, {align: "right"});

                        y += 10;
                        pdf.text("Positional allowance", 25, y);
                        pdf.setFillColor(220, 245, 220);
                        pdf.rect(90, y - 6, 50, 10, "F");
                        pdf.text("Rp", 100, y);
                        pdf.text(formatNominal(d.tunjanganJabatan), 140, y, {align: "right"});

                        y += 10;
                        pdf.text("Other Allowances", 25, y);
                        pdf.setFillColor(220, 245, 220);
                        pdf.rect(90, y - 6, 50, 10, "F");
                        pdf.text("Rp", 100, y);
                        pdf.text(formatNominal(d.tunjanganLainnya), 140, y, {align: "right"});
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
                        pdf.text("Rp", 142, y);
                        pdf.text(formatNominal(grossSalary), 190, y, {align: "right"});

                        y += 8;
                        pdf.line(15, y, 195, y);
                        pdf.setDrawColor(0);
                        pdf.setLineWidth(0.2);

                        /* =====================
                        POTONGAN
                        ===================== */
                        y += 12;
                        pdf.setFont("helvetica", "bold");
                        pdf.text("SALARY DEDUCTIONS", 20, y);
                        pdf.setFont("helvetica", "normal");

                        y += 12;
                        pdf.text("Deduct Attendance", 25, y);
                        pdf.setFillColor(255, 220, 220);
                        pdf.rect(90, y - 6, 50, 10, "F");
                        pdf.text("Rp", 100, y);
                        pdf.text(formatNominal(d.potonganKehadiran), 140, y, {align: "right"});

                        y += 10;
                        pdf.text("Deduct Koperasi", 25, y);
                        pdf.setFillColor(255, 220, 220);
                        pdf.rect(90, y - 6, 50, 10, "F");
                        pdf.text("Rp", 100, y);
                        pdf.text(formatNominal(d.potonganKoperasi), 140, y, {align: "right"});

                        pdf.setFont("helvetica", "bold");
                        pdf.text("+", 190, y);

                        y += 8;
                        pdf.setDrawColor(30, 150, 80);
                        pdf.setLineWidth(0.8);
                        pdf.line(15, y, 195, y);

                        y += 8;
                        pdf.setFillColor(255, 210, 210);
                        pdf.rect(140, y - 6, 50, 10, "F");
                        pdf.text("Total Deductions", 25, y);
                        pdf.text("Rp", 142, y);
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
                        y += 13;

                        pdf.setDrawColor(30, 100, 220);
                        pdf.setLineWidth(1);

                        // garis atas dan bawah
                        pdf.line(15, y - 8, 195, y - 8);
                        pdf.line(15, y + 7, 195, y + 7);

                        pdf.setFont("helvetica", "bold");
                        pdf.setFontSize(14);

                        pdf.text(
                            "TAKE HOME PAY",
                            25,
                            y + 3
                        );

                        // kotak hijau mengikuti area garis
                        pdf.setFillColor(180, 230, 180);
                        pdf.rect(140, y - 5, 50, 11, "F");

                        // nilai
                        pdf.text("Rp", 142, y + 2);

                        pdf.text(
                            formatNominal(takeHomePay),
                            190,
                            y + 3,
                            {
                                align: "right"
                            }
                        );

                        /* =====================
                        QR CODE SLIP GAJI
                        ===================== */
                        const qrData =
                            `JEFFAN INTERNATIONAL
        Nama: ${d.namaKaryawan}
        ID: ${d.kodeKaryawan}
        Jabatan: ${d.jabatan || "-"}
        Periode: ${getNamaBulan(d.bulan)} ${d.tahun}`;

                        console.log(QRCode);
                        const qrImage = await generateQRCode(qrData);
                        pdf.addImage(
                            qrImage,
                            "PNG",
                            155,
                            y + 10,
                            30,
                            30
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
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = "Anonymous";

                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;

                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);

                            resolve(canvas.toDataURL("image/png"));
                        };

                        img.onerror = (err) => {
                            console.error("Gagal memuat gambar:", url);
                            reject(err);
                        };

                        img.src = url;
                    });
                }
                function generateQRCode(text) {
                    return new Promise((resolve, reject) => {
                        QRCode.toDataURL(
                            text,
                            {
                                width: 500,
                                margin: 2,
                                errorCorrectionLevel: "H"
                            },
                            (error, url) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(url);
                                }
                            }
                        );
                    });
                }
                /* KOPERASI */
                window.showAddAnggota = async () => {
                    const content = document.getElementById("content");
                    content.innerHTML = `
<div class="card">
<h2>Add Anggota Koperasi</h2>
<div class="attendance-form-grid">
<div class="form-group">
<label>Select Employee</label>
<select id="koperasiEmployee"
onchange="loadEmployeeKoperasi()">
<option value="">
-- Select Employee --
</option>
</select>
</div>
<div class="form-group">
<label>Start Date</label>
<input 
type="date"
id="koperasiDate">
</div>
</div>
<br>
<div class="form-group">
<label>Name</label>
<input 
id="koperasiNama"
readonly>
</div>
<div class="form-group">
<label>Jobs</label>
<input 
id="koperasiJabatan"
readonly>
</div>
<div class="form-group">
<label>ID Koperasi</label>
<input 
id="koperasiId"
readonly>
</div>
<br>
<button onclick="saveAnggotaKoperasi()">
Save Data Koperasi
</button>
</div>
<div class="card">
<h2>Data Anggota Koperasi</h2>
<table>
<thead>
<tr>
<th>ID Koperasi</th>
<th>Name</th>
<th>Jobs</th>
<th>Start Date</th>
<th>Status</th>
<th>Action</th>
</tr>
</thead>
<tbody id="koperasiTable">
</tbody>
</table>
</div>
`;
                    loadEmployeeKoperasiSelect();
                    loadDataAnggotaKoperasi();
                    document.getElementById("koperasiDate").addEventListener("change", generateIdKoperasi);
                };

                async function loadEmployeeKoperasiSelect() {
                    const select = document.getElementById("koperasiEmployee");
                    const snap = await getDocs(collection(db, "employees"));

                    let employees = [];
                    snap.forEach(doc => {
                        const d = doc.data();
                        if (!d.status || d.status == "Active") {
                            employees.push({id: doc.id, ...d});
                        }
                    });
                    employees.sort((a, b) => {return String(a.kodeKaryawan).localeCompare(String(b.kodeKaryawan), undefined, {numeric: true});});
                    employees.forEach(emp => {select.innerHTML += `<option value="${emp.id}">${emp.kodeKaryawan} - ${emp.namaKaryawan}</option>`;});
                }

                window.loadEmployeeKoperasi = async () => {
                    const id = document.getElementById("koperasiEmployee").value;
                    if (!id) return;
                    const snap = await getDoc(doc(db, "employees", id));
                    const d = snap.data();
                    document.getElementById("koperasiNama").value = d.namaKaryawan;
                    document.getElementById("koperasiJabatan").value = d.jabatan;
                }

                async function generateIdKoperasi() {
                    const tanggal = document.getElementById("koperasiDate").value;
                    if (!tanggal) {
                        return;
                    }
                    const snap = await getDocs(collection(db, "koperasiAnggota"));
                    const nomor = String(snap.size + 1).padStart(3, "0");
                    const pecah = tanggal.split("-");
                    const tahun = pecah[0].slice(-2);
                    const bulan = pecah[1];
                    const hari = pecah[2];
                    document.getElementById("koperasiId").value = `KOP${tahun}${bulan}${hari}${nomor}`;
                }

                async function loadDataAnggotaKoperasi() {
                    const tbody = document.getElementById("koperasiTable");
                    if (!tbody) return; tbody.innerHTML = "";
                    const snap = await getDocs(collection(db, "koperasiAnggota"));

                    let anggota = [];
                    snap.forEach(doc => {anggota.push({id: doc.id, ...doc.data()});});
                    anggota.sort((a, b) => {return String(a.idKoperasi).localeCompare(String(b.idKoperasi), undefined, {numeric: true, sensitivity: "base"});});
                    anggota.forEach(d => {
                        tbody.innerHTML += `
        <tr>
        <td>${d.idKoperasi}</td>
        <td>${d.namaKaryawan}</td>
        <td>${d.jabatan}</td>
        <td>${d.tanggalMulai}</td>
        <td>${d.status}</td>
        <td>
        <button
        class="${d.status == "Active" ? "edit" : "delete"}"
        onclick="changeStatusKoperasi('${d.id}','${d.status}')">
        ${d.status}
        </button>
        </td>
        </tr>
        `;
                    });
                }

                window.saveAnggotaKoperasi = async () => {
                    try {
                        const id =
                            document.getElementById("koperasiId").value;

                        if (!id) {
                            alert("Generate ID terlebih dahulu");
                            return;
                        }

                        const empId =
                            document.getElementById(
                                "koperasiEmployee"
                            ).value;

                        if (!empId) {
                            alert("Please select an employee first.");
                            return;
                        }

                        const emp =
                            await getDoc(
                                doc(db, "employees", empId)
                            );

                        if (!emp.exists()) {
                            alert("Employee data not found");
                            return;
                        }
                        const e = emp.data();
                        const data = {
                            idKoperasi: id,
                            namaKaryawan: e.namaKaryawan,
                            jabatan: e.jabatan,
                            tanggalMulai: document.getElementById("koperasiDate").value,
                            status: "Active",
                            createdAt: new Date()
                        };

                        await addDoc(
                            collection(db, "koperasiAnggota"),
                            data
                        );
                        alert("Anggota koperasi berhasil disimpan");


                        loadDataAnggotaKoperasi();
                        document.getElementById("koperasiEmployee").value = "";
                        document.getElementById("koperasiNama").value = "";
                        document.getElementById("koperasiJabatan").value = "";
                        document.getElementById("koperasiId").value = "";
                        document.getElementById("koperasiDate").value = "";

                    }
                    catch (error) {
                        console.error(error);
                        alert(error.message);
                    }
                };
                window.changeStatusKoperasi = async (
                    id,
                    status
                ) => {
                    try {
                        const statusBaru =
                            status == "Active"
                                ? "Non Active"
                                : "Active";
                        await updateDoc(
                            doc(
                                db,
                                "koperasiAnggota",
                                id
                            ),
                            {
                                status:
                                    statusBaru
                            }
                        );
                        loadDataAnggotaKoperasi();
                    }
                    catch (error) {
                        console.error(error);
                        alert(error.message);
                    }
                };

                window.showInputSimpanan = () => {
                    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Input Transaksi Simpanan</h2>
        <p>Catat setoran dan pengambilan. Pengambilan akan mengurangi saldo anggota secara otomatis.</p>
        <div class="attendance-form-grid">
            <div class="form-group"><label>Anggota Koperasi</label><select id="simpananAnggota" onchange="loadDataAnggotaSimpanan()"><option value="">-- Pilih Anggota --</option></select></div>
            <div class="form-group"><label>ID Koperasi</label><input id="simpananId" readonly></div>
            <div class="form-group"><label>Nama</label><input id="simpananNama" readonly></div>
            <div class="form-group"><label>Jabatan</label><input id="simpananJabatan" readonly></div>
            <div class="form-group"><label>Tanggal Transaksi</label><input type="date" id="simpananTanggal"></div>
            <div class="form-group"><label>Jenis Transaksi</label><select id="tipeTransaksiSimpanan" onchange="updateTampilanSimpanan()"><option value="Setoran">Setoran Simpanan (+)</option><option value="Pengambilan">Pengambilan Simpanan (-)</option></select></div>
            <div class="form-group"><label>Kategori Simpanan</label><select id="jenisSimpanan"><option value="Simpanan Pokok">Simpanan Pokok</option><option value="Simpanan Wajib">Simpanan Wajib</option><option value="Simpanan Sukarela">Simpanan Sukarela</option><option value="Simpanan THR">Simpanan THR</option><option value="Simpanan Travelling">Simpanan Travelling</option><option value="Simpanan Tunjangan">Simpanan Tunjangan</option><option value="Simpanan Lainnya">Simpanan Lainnya</option></select></div>
            <div class="form-group"><label>Nominal (Rp)</label><input type="number" id="nominalSimpanan" min="1" step="1" placeholder="Masukkan nominal"></div>
            <div class="form-group"><label>Saldo Saat Ini</label><input id="saldoSimpananSaatIni" readonly value="Pilih anggota terlebih dahulu"></div>
            <div class="form-group"><label>Keterangan</label><input id="keteranganSimpanan" placeholder="Keterangan transaksi"></div>
        </div>
        <br><button onclick="saveSimpanan()">💾 Simpan Transaksi</button>
        <button class="back-btn" onclick="showDataSimpanan()">Lihat Riwayat Simpanan</button>
    </div>
    <div class="card">
        <h2>Riwayat Transaksi Simpanan</h2>
        <div class="attendance-filter"><div class="form-group"><label>Bulan</label><select id="filterBulanSimpanan"></select></div><div class="form-group"><label>Tahun</label><select id="filterTahunSimpanan"></select></div></div>
        <div class="table-container"><table><thead><tr><th>Tanggal</th><th>ID Koperasi</th><th>Nama</th><th>Transaksi</th><th>Kategori</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody id="simpananTable"></tbody></table></div>
        <h3 id="totalSimpananInputLabel">Saldo bersih periode: Rp0</h3>
    </div>`;
                    loadAnggotaSimpanan();
                    loadFilterSimpanan();
                    document.getElementById("simpananTanggal").value = new Date().toISOString().slice(0, 10);
                };

                window.updateTampilanSimpanan = () => {
                    const isWithdrawal = document.getElementById("tipeTransaksiSimpanan")?.value === "Pengambilan";
                    const label = document.querySelector('label[for="nominalSimpanan"]');
                    const input = document.getElementById("nominalSimpanan");
                    if (input) input.placeholder = isWithdrawal ? "Nominal yang diambil" : "Nominal setoran";
                };

                function loadFilterSimpanan() {
                    const bulan = document.getElementById("filterBulanSimpanan");
                    const tahun = document.getElementById("filterTahunSimpanan");
                    if (!bulan || !tahun) return;
                    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                    bulan.innerHTML = namaBulan.map((b, i) => `<option value="${i + 1}">${b}</option>`).join("");
                    const sekarang = new Date();
                    tahun.innerHTML = Array.from({length: 16}, (_, i) => sekarang.getFullYear() - 5 + i).map(y => `<option value="${y}">${y}</option>`).join("");
                    bulan.value = sekarang.getMonth() + 1; tahun.value = sekarang.getFullYear();
                    bulan.addEventListener("change", loadDataSimpanan);
                    tahun.addEventListener("change", loadDataSimpanan);
                    loadDataSimpanan();
                }

                async function loadAnggotaSimpanan() {
                    const select = document.getElementById("simpananAnggota");
                    if (!select) return;
                    select.innerHTML = '<option value="">-- Pilih Anggota --</option>';
                    const snap = await getDocs(collection(db, "koperasiAnggota"));
                    const anggota = [];
                    snap.forEach(item => {const d = item.data(); if (d.status === "Active") anggota.push({id: item.id, ...d});});
                    anggota.sort((a, b) => String(a.idKoperasi || "").localeCompare(String(b.idKoperasi || ""), undefined, {numeric: true}));
                    anggota.forEach(a => select.insertAdjacentHTML("beforeend", `<option value="${a.id}">${a.idKoperasi || ""} - ${a.namaKaryawan || ""}</option>`));
                }

                async function hitungSaldoAnggota(idKoperasi) {
                    const snap = await getDocs(collection(db, "koperasiSimpanan"));
                    let saldo = 0;
                    snap.forEach(item => {
                        const d = item.data();
                        if (String(d.idKoperasi) !== String(idKoperasi)) return;
                        const nominal = Number(d.nominal) || 0;
                        const tipe = String(d.tipeTransaksi || d.jenisTransaksi || d.jenisSimpanan || "").toLowerCase();
                        saldo += (tipe.includes("pengambilan") || tipe.includes("penarikan") || d.arah === "keluar") ? -nominal : nominal;
                    });
                    return saldo;
                }

                window.loadDataAnggotaSimpanan = async () => {
                    const id = document.getElementById("simpananAnggota")?.value;
                    ["simpananId", "simpananNama", "simpananJabatan"].forEach(key => {const el = document.getElementById(key); if (el) el.value = "";});
                    const saldoEl = document.getElementById("saldoSimpananSaatIni");
                    if (saldoEl) saldoEl.value = "Pilih anggota terlebih dahulu";
                    if (!id) return;
                    try {
                        const snap = await getDoc(doc(db, "koperasiAnggota", id));
                        if (!snap.exists()) return;
                        const d = snap.data();
                        document.getElementById("simpananId").value = d.idKoperasi || "";
                        document.getElementById("simpananNama").value = d.namaKaryawan || "";
                        document.getElementById("simpananJabatan").value = d.jabatan || "";
                        const saldo = await hitungSaldoAnggota(d.idKoperasi);
                        if (saldoEl) saldoEl.value = formatNominal(saldo);
                    } catch (error) {console.error(error); alert("Gagal memuat data anggota/saldo: " + error.message);}
                };

                async function loadDataSimpanan() {
                    const tbody = document.getElementById("simpananTable");
                    if (!tbody) return;
                    tbody.innerHTML = '<tr><td colspan="7">Memuat data...</td></tr>';
                    try {
                        const bulan = Number(document.getElementById("filterBulanSimpanan")?.value);
                        const tahun = Number(document.getElementById("filterTahunSimpanan")?.value);
                        const snap = await getDocs(collection(db, "koperasiSimpanan"));
                        const data = [];
                        snap.forEach(item => {const d = item.data(); if (Number(d.bulan) === bulan && Number(d.tahun) === tahun) data.push({id: item.id, ...d});});
                        data.sort((a, b) => String(a.tanggal || "").localeCompare(String(b.tanggal || "")));
                        tbody.innerHTML = ""; let net = 0;
                        data.forEach(d => {
                            const nominal = Number(d.nominal) || 0;
                            const tipe = String(d.tipeTransaksi || d.jenisTransaksi || d.jenisSimpanan || "");
                            const withdrawal = tipe.toLowerCase().includes("pengambilan") || tipe.toLowerCase().includes("penarikan") || d.arah === "keluar";
                            net += withdrawal ? -nominal : nominal;
                            const tr = document.createElement("tr");
                            [d.tanggal, d.idKoperasi, d.namaKaryawan, withdrawal ? "Pengambilan" : "Setoran", d.kategoriSimpanan || d.jenisSimpanan || "Simpanan Lainnya", (withdrawal ? "−" : "+") + formatNominal(nominal), d.keterangan || ""].forEach(v => {const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td);});
                            tbody.appendChild(tr);
                        });
                        if (!data.length) tbody.innerHTML = '<tr><td colspan="7">Tidak ada transaksi simpanan pada periode ini.</td></tr>';
                        const totalEl = document.getElementById("totalSimpananInputLabel"); if (totalEl) totalEl.textContent = "Saldo bersih transaksi periode ini: " + formatNominal(net);
                    } catch (error) {console.error(error); tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data: ${error.message}</td></tr>`;}
                }

                window.saveSimpanan = async () => {
                    try {
                        const idKoperasi = document.getElementById("simpananId")?.value;
                        const tanggal = document.getElementById("simpananTanggal")?.value;
                        const nominal = Number(document.getElementById("nominalSimpanan")?.value);
                        const tipe = document.getElementById("tipeTransaksiSimpanan")?.value || "Setoran";
                        if (!idKoperasi) return alert("Silakan pilih anggota koperasi.");
                        if (!tanggal) return alert("Silakan pilih tanggal transaksi.");
                        if (!Number.isFinite(nominal) || nominal <= 0) return alert("Nominal harus lebih dari 0.");
                        if (tipe === "Pengambilan") {
                            const saldo = await hitungSaldoAnggota(idKoperasi);
                            if (nominal > saldo) return alert("Pengambilan melebihi saldo tersedia. Saldo saat ini: " + formatNominal(saldo));
                        }
                        const tanggalParts = tanggal.split("-");
                        const data = {idKoperasi, namaKaryawan: document.getElementById("simpananNama").value, jabatan: document.getElementById("simpananJabatan").value, tanggal, bulan: Number(tanggalParts[1]), tahun: Number(tanggalParts[0]), tipeTransaksi: tipe, arah: tipe === "Pengambilan" ? "keluar" : "masuk", kategoriSimpanan: document.getElementById("jenisSimpanan").value, jenisSimpanan: tipe === "Pengambilan" ? "Pengambilan Simpanan" : "Setoran Simpanan", nominal, keterangan: document.getElementById("keteranganSimpanan").value.trim(), createdAt: new Date()};
                        await addDoc(collection(db, "koperasiSimpanan"), data);
                        alert(tipe === "Pengambilan" ? "Pengambilan simpanan berhasil dicatat dan saldo dikurangi." : "Setoran simpanan berhasil disimpan.");
                        document.getElementById("nominalSimpanan").value = ""; document.getElementById("keteranganSimpanan").value = "";
                        await loadDataSimpanan(); await window.loadDataAnggotaSimpanan();
                    } catch (error) {console.error(error); alert("Gagal menyimpan transaksi: " + error.message);}
                };

                function hitungAngsuranFlat(pokok, tenor, ratePersen) {
                    const angsuranPokok = pokok / tenor;
                    const bungaBulanan = pokok * (ratePersen / 100);
                    return {angsuranPokok, bungaBulanan, angsuranBulanan: angsuranPokok + bungaBulanan, totalBunga: bungaBulanan * tenor, totalPengembalian: pokok + bungaBulanan * tenor};
                }

                window.previewPinjaman = () => {
                    const nominal = Number(document.getElementById("nominalPinjaman")?.value) || 0;
                    const tenor = Number(document.getElementById("tenorPinjaman")?.value) || 0;
                    const rate = Number(document.getElementById("ratePinjaman")?.value) || 0;
                    const out = document.getElementById("previewAngsuranPinjaman");
                    if (!out) return;
                    if (nominal <= 0 || tenor < 1 || rate < 0) {out.textContent = "Isi nominal, tenor, dan rate untuk melihat simulasi."; return;}
                    const h = hitungAngsuranFlat(nominal, tenor, rate);
                    out.innerHTML = `<strong>Simulasi Angsuran Flat</strong><br>Pokok per bulan: ${formatNominal(h.angsuranPokok)}<br>Bunga per bulan: ${formatNominal(h.bungaBulanan)}<br><strong>Setoran per bulan: ${formatNominal(h.angsuranBulanan)}</strong><br>Total bunga: ${formatNominal(h.totalBunga)}<br>Total pengembalian: ${formatNominal(h.totalPengembalian)}`;
                };

                window.showInputPinjaman = async () => {
                    document.getElementById("content").innerHTML = `
    <div class="card"><h2>Input Pinjaman Koperasi</h2><p>Nomor SPH wajib unik untuk setiap pinjaman. Rate dihitung dengan metode bunga flat dari pokok awal.</p>
        <div class="employee-form-grid">
            <div class="form-group"><label>Anggota Koperasi</label><select id="pinjamanAnggota" onchange="loadDataAnggotaPinjaman()"><option value="">-- Pilih Anggota --</option></select></div>
            <div class="form-group"><label>ID Koperasi</label><input id="pinjamanId" readonly></div>
            <div class="form-group"><label>Nama Anggota</label><input id="pinjamanNama" readonly></div>
            <div class="form-group"><label>Jabatan</label><input id="pinjamanJabatan" readonly></div>
            <div class="form-group"><label>No. SPH (Surat Perjanjian Hutang)</label><input id="nomorSPH" maxlength="80" placeholder="Contoh: SPH/KOP/2026/001" required></div>
            <div class="form-group"><label>Tanggal Pinjaman</label><input id="pinjamanTanggal" type="date" required></div>
            <div class="form-group"><label>Nominal Pinjaman (Rp)</label><input id="nominalPinjaman" type="number" min="1" step="1" placeholder="Masukkan nominal" oninput="previewPinjaman()" required></div>
            <div class="form-group"><label>Tenor (bulan)</label><input id="tenorPinjaman" type="number" min="1" step="1" value="1" oninput="previewPinjaman()" required></div>
            <div class="form-group"><label>Rate per Bulan (%)</label><input id="ratePinjaman" type="number" min="0" max="100" step="0.01" value="" placeholder="Contoh 1.5" oninput="previewPinjaman()" required></div>
            <div class="form-group"><label>Keterangan</label><input id="keteranganPinjaman" placeholder="Keterangan pinjaman"></div>
        </div>
        <div id="previewAngsuranPinjaman" class="card" style="margin-top:16px;background:#f1f5f9;line-height:1.8">Isi nominal, tenor, dan rate untuk melihat simulasi.</div>
        <br><button onclick="savePinjaman()">💾 Simpan Pinjaman</button><button class="back-btn" onclick="showDataPinjaman()">Lihat Data Pinjaman</button>
    </div>`;
                    document.getElementById("pinjamanTanggal").value = new Date().toISOString().slice(0, 10);
                    await loadAnggotaPinjaman();
                };

                async function loadAnggotaPinjaman() {
                    const select = document.getElementById("pinjamanAnggota"); if (!select) return;
                    select.innerHTML = '<option value="">-- Pilih Anggota --</option>';
                    const snap = await getDocs(collection(db, "koperasiAnggota")); const anggota = [];
                    snap.forEach(item => {const d = item.data(); if (d.status === "Active") anggota.push({id: item.id, ...d});});
                    anggota.sort((a, b) => String(a.idKoperasi || "").localeCompare(String(b.idKoperasi || ""), undefined, {numeric: true}));
                    anggota.forEach(a => select.insertAdjacentHTML("beforeend", `<option value="${a.id}">${a.idKoperasi || ""} - ${a.namaKaryawan || ""}</option>`));
                }

                window.loadDataAnggotaPinjaman = async () => {
                    const id = document.getElementById("pinjamanAnggota")?.value;
                    ["pinjamanId", "pinjamanNama", "pinjamanJabatan"].forEach(key => {const el = document.getElementById(key); if (el) el.value = "";});
                    if (!id) return;
                    const snap = await getDoc(doc(db, "koperasiAnggota", id)); if (!snap.exists()) return;
                    const d = snap.data();
                    document.getElementById("pinjamanId").value = d.idKoperasi || "";
                    document.getElementById("pinjamanNama").value = d.namaKaryawan || "";
                    document.getElementById("pinjamanJabatan").value = d.jabatan || "";
                };

                window.savePinjaman = async () => {
                    try {
                        const anggotaId = document.getElementById("pinjamanAnggota")?.value;
                        const tanggal = document.getElementById("pinjamanTanggal")?.value;
                        const nomorSPH = document.getElementById("nomorSPH")?.value.trim();
                        const nominal = Number(document.getElementById("nominalPinjaman")?.value);
                        const tenor = Number(document.getElementById("tenorPinjaman")?.value);
                        const rateRaw = document.getElementById("ratePinjaman")?.value ?? "";
                        const rate = Number(rateRaw);
                        if (!anggotaId) return alert("Silakan pilih anggota koperasi.");
                        if (!nomorSPH) return alert("Nomor SPH wajib diisi.");
                        if (!tanggal) return alert("Silakan pilih tanggal pinjaman.");
                        if (!Number.isFinite(nominal) || nominal <= 0) return alert("Nominal pinjaman harus lebih dari 0.");
                        if (!Number.isInteger(tenor) || tenor < 1) return alert("Tenor minimal 1 bulan.");
                        if (String(rateRaw).trim() === "" || !Number.isFinite(rate) || rate < 0 || rate > 100) return alert("Rate wajib diisi dengan angka antara 0 sampai 100% per bulan.");
                        const allLoans = await getDocs(collection(db, "koperasiPinjaman"));
                        let sphExists = false;
                        allLoans.forEach(item => {if (String(item.data().nomorSPH || item.data().sph || "").trim().toLowerCase() === nomorSPH.toLowerCase()) sphExists = true;});
                        if (sphExists) return alert("Nomor SPH sudah digunakan. Masukkan nomor SPH yang berbeda.");
                        const anggotaSnap = await getDoc(doc(db, "koperasiAnggota", anggotaId)); if (!anggotaSnap.exists()) return alert("Data anggota tidak ditemukan.");
                        const a = anggotaSnap.data(); const calc = hitungAngsuranFlat(nominal, tenor, rate);
                        await addDoc(collection(db, "koperasiPinjaman"), {anggotaId, idKoperasi: a.idKoperasi || "", namaKaryawan: a.namaKaryawan || "", jabatan: a.jabatan || "", nomorSPH, tanggal, bulan: Number(tanggal.slice(5, 7)), tahun: Number(tanggal.slice(0, 4)), nominal, tenor, rateBulanan: rate, angsuranPokokBulanan: calc.angsuranPokok, bungaBulanan: calc.bungaBulanan, angsuranBulanan: calc.angsuranBulanan, totalBunga: calc.totalBunga, totalPengembalian: calc.totalPengembalian, keterangan: document.getElementById("keteranganPinjaman")?.value.trim() || "", status: "Active", createdAt: new Date()});
                        alert("Data pinjaman berhasil disimpan. Angsuran per bulan: " + formatNominal(calc.angsuranBulanan));
                        showDataPinjaman();
                    } catch (error) {console.error(error); alert("Gagal menyimpan pinjaman: " + error.message);}
                };

                window.showDataSimpanan = () => {
                    document.getElementById("content").innerHTML = `
    <div class="card"><h2>Data Simpanan Koperasi</h2><p>Nominal pengambilan ditampilkan sebagai pengurang saldo.</p>
        <div class="attendance-filter"><div class="form-group"><label>Bulan</label><select id="dataSimpananBulan"></select></div><div class="form-group"><label>Tahun</label><select id="dataSimpananTahun"></select></div><button onclick="loadAllDataSimpanan()">🔍 Tampilkan</button><button onclick="showInputSimpanan()">➕ Input Transaksi</button></div><br>
        <div class="table-container"><table><thead><tr><th>Tanggal</th><th>ID Koperasi</th><th>Nama</th><th>Jabatan</th><th>Transaksi</th><th>Kategori</th><th>Nominal (+/-)</th><th>Keterangan</th></tr></thead><tbody id="allSimpananTable"></tbody></table></div>
        <h3 id="totalSimpananLabel" style="margin-top:15px">Saldo bersih periode: Rp 0</h3>
    </div>`;
                    const bulan = document.getElementById("dataSimpananBulan"), tahun = document.getElementById("dataSimpananTahun");
                    const names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                    bulan.innerHTML = names.map((n, i) => `<option value="${i + 1}">${n}</option>`).join("");
                    const now = new Date(); tahun.innerHTML = Array.from({length: 16}, (_, i) => now.getFullYear() - 5 + i).map(y => `<option value="${y}">${y}</option>`).join("");
                    bulan.value = now.getMonth() + 1; tahun.value = now.getFullYear(); loadAllDataSimpanan();
                };

                window.loadAllDataSimpanan = async () => {
                    const tbody = document.getElementById("allSimpananTable"); if (!tbody) return;
                    tbody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';
                    try {
                        const bulan = Number(document.getElementById("dataSimpananBulan").value), tahun = Number(document.getElementById("dataSimpananTahun").value);
                        const snap = await getDocs(collection(db, "koperasiSimpanan")); const data = [];
                        snap.forEach(item => {const d = item.data(); if (Number(d.bulan) === bulan && Number(d.tahun) === tahun) data.push({id: item.id, ...d});});
                        data.sort((a, b) => String(a.tanggal || "").localeCompare(String(b.tanggal || ""))); tbody.innerHTML = ""; let net = 0;
                        data.forEach(d => {
                            const nominal = Number(d.nominal) || 0, tipe = String(d.tipeTransaksi || d.jenisTransaksi || d.jenisSimpanan || "");
                            const withdrawal = tipe.toLowerCase().includes("pengambilan") || tipe.toLowerCase().includes("penarikan") || d.arah === "keluar"; net += withdrawal ? -nominal : nominal;
                            const tr = document.createElement("tr");
                            [d.tanggal, d.idKoperasi, d.namaKaryawan, d.jabatan, withdrawal ? "Pengambilan" : "Setoran", d.kategoriSimpanan || d.jenisSimpanan || "Simpanan Lainnya", (withdrawal ? "−" : "+") + formatNominal(nominal), d.keterangan || ""].forEach(v => {const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td);}); tbody.appendChild(tr);
                        });
                        if (!data.length) tbody.innerHTML = '<tr><td colspan="8">Tidak ada transaksi simpanan pada periode ini.</td></tr>';
                        document.getElementById("totalSimpananLabel").textContent = "Saldo bersih transaksi periode ini: " + formatNominal(net);
                    } catch (error) {console.error(error); tbody.innerHTML = `<tr><td colspan="8">Gagal memuat data: ${error.message}</td></tr>`;}
                };

                window.showDataPinjaman = async () => {
                    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Data Pinjaman Koperasi</h2>
        <p>Setoran angsuran menggunakan kewajiban bulanan yang disepakati saat pinjaman dibuat. Setiap pembayaran dicatat sebagai riwayat dan mengurangi sisa kewajiban.</p>
        <div class="attendance-filter">
            <div class="form-group"><label>Bulan Pinjaman</label><select id="dataPinjamanBulan"></select></div>
            <div class="form-group"><label>Tahun Pinjaman</label><select id="dataPinjamanTahun"></select></div>
            <button onclick="loadAllDataPinjaman()">🔍 Tampilkan</button>
            <button onclick="showInputPinjaman()">➕ Input Pinjaman</button>
        </div><br>
        <div class="table-container"><table><thead><tr><th>Tanggal</th><th>No. SPH</th><th>ID Koperasi</th><th>Nama</th><th>Pokok Awal</th><th>Rate/Bulan</th><th>Tenor</th><th>Angsuran/Bulan</th><th>Angsuran Terbayar</th><th>Total Dibayar</th><th>Sisa Pokok</th><th>Sisa Kewajiban</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="allPinjamanTable"></tbody></table></div>
        <h3 id="totalPinjamanLabel" style="margin-top:15px">Memuat data...</h3>
        <div id="riwayatSetoranPinjaman" class="card" style="display:none;margin-top:16px"></div>
    </div>`;
                    const bulan = document.getElementById("dataPinjamanBulan");
                    const tahun = document.getElementById("dataPinjamanTahun");
                    const names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                    bulan.innerHTML = names.map((n, i) => `<option value="${i + 1}">${n}</option>`).join("");
                    const now = new Date();
                    tahun.innerHTML = Array.from({length: 16}, (_, i) => now.getFullYear() - 5 + i).map(y => `<option value="${y}">${y}</option>`).join("");
                    bulan.value = now.getMonth() + 1; tahun.value = now.getFullYear();
                    await loadAllDataPinjaman();
                };

                window.loadAllDataPinjaman = async () => {
                    const tbody = document.getElementById("allPinjamanTable");
                    if (!tbody) return;
                    tbody.innerHTML = '<tr><td colspan="14">Memuat data...</td></tr>';
                    try {
                        const bulan = Number(document.getElementById("dataPinjamanBulan").value);
                        const tahun = Number(document.getElementById("dataPinjamanTahun").value);
                        const [loanSnap, paymentSnap] = await Promise.all([
                            getDocs(collection(db, "koperasiPinjaman")),
                            getDocs(collection(db, "koperasiSetoranPinjaman"))
                        ]);
                        const paymentByLoan = {};
                        paymentSnap.forEach(item => {
                            const pay = item.data();
                            if (!paymentByLoan[pay.pinjamanId]) paymentByLoan[pay.pinjamanId] = [];
                            paymentByLoan[pay.pinjamanId].push({id: item.id, ...pay});
                        });
                        Object.values(paymentByLoan).forEach(arr => arr.sort((a, b) => Number(a.angsuranKe || 0) - Number(b.angsuranKe || 0)));
                        const data = [];
                        loanSnap.forEach(item => {
                            const d = item.data();
                            if (Number(d.bulan) === bulan && Number(d.tahun) === tahun) data.push({id: item.id, ...d});
                        });
                        data.sort((a, b) => String(a.tanggal || "").localeCompare(String(b.tanggal || "")));
                        tbody.innerHTML = "";
                        let total = 0, totalSisaPokok = 0, totalSisaKewajiban = 0;
                        for (const d of data) {
                            const pokok = Number(d.nominal) || 0, tenor = Math.max(1, Number(d.tenor) || 1), rate = Number(d.rateBulanan ?? d.rate ?? 0);
                            const calc = hitungAngsuranFlat(pokok, tenor, rate);
                            const angsuran = Math.round(Number(d.angsuranBulanan) || calc.angsuranBulanan);
                            const payments = paymentByLoan[d.id] || [];
                            const paidCount = payments.length || Number(d.jumlahAngsuranTerbayar) || 0;
                            const totalPaid = payments.length ? payments.reduce((sum, x) => sum + (Number(x.nominalSetoran) || 0), 0) : Number(d.totalTerbayar) || 0;
                            const totalKembali = Math.round(Number(d.totalPengembalian) || calc.totalPengembalian);
                            const principalPaid = payments.length ? payments.reduce((sum, x) => sum + (Number(x.pokokDibayar) || 0), 0) : Math.min(pokok, paidCount * Math.round(calc.angsuranPokok));
                            const remainingPrincipal = Math.max(0, pokok - principalPaid);
                            const remainingObligation = Math.max(0, totalKembali - totalPaid);
                            const status = remainingObligation <= 0 || paidCount >= tenor ? "Lunas" : (d.status || "Active");
                            total += pokok; totalSisaPokok += remainingPrincipal; totalSisaKewajiban += remainingObligation;
                            const tr = document.createElement("tr");
                            [d.tanggal, d.nomorSPH || d.sph || "—", d.idKoperasi || "", d.namaKaryawan || "", formatNominal(pokok), `${rate}%`, `${tenor} bulan`, formatNominal(angsuran), `${Math.min(paidCount, tenor)}/${tenor}`, formatNominal(totalPaid), formatNominal(remainingPrincipal), formatNominal(remainingObligation), status].forEach(v => {const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td);});
                            const action = document.createElement("td");
                            if (status !== "Lunas") {
                                const payBtn = document.createElement("button"); payBtn.textContent = "💵 Setor Angsuran"; payBtn.className = "edit";
                                payBtn.addEventListener("click", () => prosesSetoranPinjaman(d.id)); action.appendChild(payBtn);
                            } else {
                                const done = document.createElement("span"); done.textContent = "LUNAS"; done.style.color = "#15803d"; done.style.fontWeight = "700"; action.appendChild(done);
                            }
                            const historyBtn = document.createElement("button"); historyBtn.textContent = "📄 Riwayat"; historyBtn.style.marginTop = "5px"; historyBtn.addEventListener("click", () => lihatRiwayatSetoranPinjaman(d.id, d.nomorSPH || d.sph || "—", d.namaKaryawan || "")); action.appendChild(historyBtn);
                            tr.appendChild(action); tbody.appendChild(tr);
                            if (status === "Lunas" && d.status !== "Lunas") await updateDoc(doc(db, "koperasiPinjaman", d.id), {status: "Lunas", jumlahAngsuranTerbayar: paidCount, totalTerbayar: totalPaid, sisaPokok: 0, sisaKewajiban: 0});
                        }
                        if (!data.length) tbody.innerHTML = '<tr><td colspan="14">Tidak ada data pinjaman pada periode ini.</td></tr>';
                        document.getElementById("totalPinjamanLabel").textContent = `Total pokok periode ini: ${formatNominal(total)} | Sisa pokok: ${formatNominal(totalSisaPokok)} | Sisa seluruh kewajiban: ${formatNominal(totalSisaKewajiban)}`;
                    } catch (error) {
                        console.error(error); tbody.innerHTML = `<tr><td colspan="14">Gagal memuat data: ${error.message}</td></tr>`;
                    }
                };

                window.prosesSetoranPinjaman = async (pinjamanId) => {
                    try {
                        const loanRef = doc(db, "koperasiPinjaman", pinjamanId);
                        const loanSnap = await getDoc(loanRef);
                        if (!loanSnap.exists()) return alert("Data pinjaman tidak ditemukan.");
                        const loan = loanSnap.data();
                        const pokok = Number(loan.nominal) || 0, tenor = Math.max(1, Number(loan.tenor) || 1), rate = Number(loan.rateBulanan ?? loan.rate ?? 0);
                        const calc = hitungAngsuranFlat(pokok, tenor, rate);
                        const paymentsSnap = await getDocs(collection(db, "koperasiSetoranPinjaman"));
                        const payments = [];
                        paymentsSnap.forEach(item => {const p = item.data(); if (p.pinjamanId === pinjamanId) payments.push({id: item.id, ...p});});
                        payments.sort((a, b) => Number(a.angsuranKe || 0) - Number(b.angsuranKe || 0));
                        const installmentNo = payments.length + 1;
                        const totalKembali = Math.round(Number(loan.totalPengembalian) || calc.totalPengembalian);
                        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.nominalSetoran) || 0), 0);
                        const remainingObligation = Math.max(0, totalKembali - totalPaid);
                        if ((loan.status || "Active") === "Lunas" || installmentNo > tenor || remainingObligation <= 0) return alert("Pinjaman ini sudah lunas.");
                        // Angsuran tetap sesuai perhitungan awal; angsuran terakhir menyesuaikan sisa kewajiban akibat pembulatan.
                        const nominalSetoran = installmentNo === tenor ? remainingObligation : Math.min(remainingObligation, Math.round(Number(loan.angsuranBulanan) || calc.angsuranBulanan));
                        const principalPaidBefore = payments.reduce((sum, p) => sum + (Number(p.pokokDibayar) || 0), 0);
                        const sisaPokokBefore = Math.max(0, pokok - principalPaidBefore);
                        const pokokDibayar = installmentNo === tenor ? sisaPokokBefore : Math.min(sisaPokokBefore, Math.round(calc.angsuranPokok));
                        const bungaDibayar = Math.max(0, nominalSetoran - pokokDibayar);
                        const tanggalDefault = new Date().toISOString().slice(0, 10);
                        const tanggalInput = prompt(`Setoran angsuran ke-${installmentNo} untuk ${loan.namaKaryawan || "anggota"}\nNo. SPH: ${loan.nomorSPH || loan.sph || "—"}\nPokok dibayar: ${formatNominal(pokokDibayar)}\nBunga dibayar: ${formatNominal(bungaDibayar)}\nTotal setoran wajib: ${formatNominal(nominalSetoran)}\n\nMasukkan tanggal setoran (YYYY-MM-DD):`, tanggalDefault);
                        if (tanggalInput === null) return;
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalInput) || Number.isNaN(Date.parse(tanggalInput))) return alert("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
                        if (!confirm(`Konfirmasi setoran angsuran ke-${installmentNo}?\nNominal: ${formatNominal(nominalSetoran)}\nPokok: ${formatNominal(pokokDibayar)}\nBunga: ${formatNominal(bungaDibayar)}\nTanggal: ${tanggalInput}`)) return;
                        const newTotalPaid = totalPaid + nominalSetoran;
                        const newSisaPokok = Math.max(0, sisaPokokBefore - pokokDibayar);
                        const newSisaKewajiban = Math.max(0, totalKembali - newTotalPaid);
                        const newStatus = newSisaKewajiban <= 0 || installmentNo >= tenor ? "Lunas" : "Active";
                        const batch = writeBatch(db);
                        const paymentRef = doc(collection(db, "koperasiSetoranPinjaman"));
                        const dateParts = tanggalInput.split("-");
                        batch.set(paymentRef, {pinjamanId, nomorSPH: loan.nomorSPH || loan.sph || "", anggotaId: loan.anggotaId || "", idKoperasi: loan.idKoperasi || "", namaKaryawan: loan.namaKaryawan || "", tanggal: tanggalInput, bulan: Number(dateParts[1]), tahun: Number(dateParts[0]), angsuranKe: installmentNo, nominalSetoran, pokokDibayar, bungaDibayar, sisaPokok: newSisaPokok, sisaKewajiban: newSisaKewajiban, createdAt: new Date()});
                        batch.update(loanRef, {jumlahAngsuranTerbayar: installmentNo, totalTerbayar: newTotalPaid, sisaPokok: newSisaPokok, sisaKewajiban: newSisaKewajiban, status: newStatus, tanggalSetoranTerakhir: tanggalInput});
                        await batch.commit();
                        alert(`Setoran angsuran berhasil dicatat.\nSisa pokok: ${formatNominal(newSisaPokok)}\nSisa kewajiban: ${formatNominal(newSisaKewajiban)}\nStatus: ${newStatus}`);
                        await loadAllDataPinjaman();
                    } catch (error) {console.error(error); alert("Setoran gagal disimpan: " + error.message);}
                };

                window.lihatRiwayatSetoranPinjaman = async (pinjamanId, sph, nama) => {
                    const panel = document.getElementById("riwayatSetoranPinjaman");
                    if (!panel) return;
                    try {
                        const snap = await getDocs(collection(db, "koperasiSetoranPinjaman"));
                        const rows = [];
                        snap.forEach(item => {const d = item.data(); if (d.pinjamanId === pinjamanId) rows.push({id: item.id, ...d});});
                        rows.sort((a, b) => Number(a.angsuranKe || 0) - Number(b.angsuranKe || 0));
                        panel.style.display = "block";
                        panel.innerHTML = `<h3>Riwayat Setoran — ${String(sph).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))}</h3><p>${String(nama).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))}</p><div class="table-container"><table><thead><tr><th>Angsuran Ke</th><th>Tanggal</th><th>Pokok</th><th>Bunga</th><th>Total Setoran</th><th>Sisa Pokok</th><th>Sisa Kewajiban</th></tr></thead><tbody id="riwayatSetoranRows"></tbody></table></div><button onclick="document.getElementById('riwayatSetoranPinjaman').style.display='none'">Tutup Riwayat</button>`;
                        const tbody = panel.querySelector("#riwayatSetoranRows");
                        rows.forEach(d => {const tr = document.createElement("tr");[d.angsuranKe, d.tanggal, formatNominal(d.pokokDibayar), formatNominal(d.bungaDibayar), formatNominal(d.nominalSetoran), formatNominal(d.sisaPokok), formatNominal(d.sisaKewajiban)].forEach(v => {const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td);}); tbody.appendChild(tr);});
                        if (!rows.length) tbody.innerHTML = '<tr><td colspan="7">Belum ada setoran untuk pinjaman ini.</td></tr>';
                        panel.scrollIntoView({behavior: "smooth", block: "start"});
                    } catch (error) {console.error(error); alert("Gagal memuat riwayat setoran: " + error.message);}
                };

                window.changeStatusPinjaman = async (id, status) => {
                    if (status !== "Lunas") return alert("Status Lunas ditetapkan otomatis setelah seluruh kewajiban dibayar. Untuk mencatat pembayaran, gunakan tombol Setor Angsuran.");
                    if (!confirm("Aktifkan kembali pinjaman yang berstatus Lunas? Gunakan hanya jika status sebelumnya salah.")) return;
                    try {
                        await updateDoc(doc(db, "koperasiPinjaman", id), {status: "Active"});
                        await loadAllDataPinjaman();
                    } catch (error) {console.error(error); alert("Gagal mengubah status: " + error.message);}
                };

                window.showNeraca = async () => {
                    document.getElementById("content").innerHTML = `
    <div class="card">
        <h2>Neraca Koperasi</h2>
        <p>Ringkasan dihitung dari data simpanan dan pinjaman yang tersimpan di Firestore.</p>
        <div class="stat-container">
            <div class="stat"><h3>Total Simpanan Anggota</h3><h2 id="neracaSimpanan">Memuat...</h2></div>
            <div class="stat"><h3>Total Pinjaman Aktif</h3><h2 id="neracaPinjaman">Memuat...</h2></div>
            <div class="stat"><h3>Selisih (Pinjaman - Simpanan)</h3><h2 id="neracaSelisih">Memuat...</h2></div>
        </div>
        <br><button onclick="showDataSimpanan()">Data Simpanan</button>
        <button onclick="showDataPinjaman()">Data Pinjaman</button>
        <button onclick="showInputSimpanan()">Input Simpanan</button>
        <button onclick="showInputPinjaman()">Input Pinjaman</button>
    </div>`;
                    try {
                        const [simpananSnap, pinjamanSnap] = await Promise.all([
                            getDocs(collection(db, "koperasiSimpanan")),
                            getDocs(collection(db, "koperasiPinjaman"))
                        ]);
                        let simpanan = 0, pinjaman = 0;
                        simpananSnap.forEach(x => {const d = x.data(); const n = Number(d.nominal) || 0; const t = String(d.tipeTransaksi || d.jenisTransaksi || d.jenisSimpanan || "").toLowerCase(); simpanan += (t.includes("pengambilan") || t.includes("penarikan") || d.arah === "keluar") ? -n : n;});
                        pinjamanSnap.forEach(x => {const d = x.data(); if ((d.status || "Active") !== "Lunas") pinjaman += Number(d.nominal) || 0;});
                        document.getElementById("neracaSimpanan").textContent = formatNominal(simpanan);
                        document.getElementById("neracaPinjaman").textContent = formatNominal(pinjaman);
                        document.getElementById("neracaSelisih").textContent = formatNominal(pinjaman - simpanan);
                    } catch (error) {
                        console.error(error);
                        ["neracaSimpanan", "neracaPinjaman", "neracaSelisih"].forEach(id => {const el = document.getElementById(id); if (el) el.textContent = "Gagal memuat";});
                        alert("Neraca tidak dapat dimuat: " + error.message);
                    }
                };

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

                /* CHART - DATA AKTUAL FIRESTORE, BUKAN DATA CONTOH */
                async function createDashboardChart() {
                    if (typeof Chart === "undefined") {
                        console.error("Chart.js belum dimuat");
                        return;
                    }
                    chartInstances.forEach(chart => {try {chart.destroy();} catch (e) { } });
                    chartInstances = [];
                    const makeChart = (id, type, labels, data, label) => {
                        const canvas = document.getElementById(id);
                        if (!canvas) return;
                        const chart = new Chart(canvas, {
                            type,
                            data: {labels, datasets: [{label, data, borderWidth: 1, tension: 0.25}]},
                            options: {responsive: true, maintainAspectRatio: false}
                        });
                        chartInstances.push(chart);
                    };
                    try {
                        const [employeeSnap, attendanceSnap] = await Promise.all([
                            getDocs(collection(db, "employees")),
                            getDocs(collection(db, "attendance"))
                        ]);
                        const employees = employeeSnap.docs.map(x => x.data());
                        const attendance = attendanceSnap.docs.map(x => x.data());
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth() + 1;
                        const monthAttendance = attendance.filter(a => Number(a.bulan) === month && Number(a.tahun) === year);
                        const countBy = (items, keyFn) => {
                            const counts = {};
                            items.forEach(item => {const key = String(keyFn(item) || "Tidak diisi").trim() || "Tidak diisi"; counts[key] = (counts[key] || 0) + 1;});
                            return Object.entries(counts).sort((a, b) => b[1] - a[1]);
                        };
                        const gender = countBy(employees, e => e.jenisKelamin);
                        makeChart("genderChart", "doughnut", gender.map(x => x[0]), gender.map(x => x[1]), "Karyawan");

                        const daysInMonth = new Date(year, month, 0).getDate();
                        const dayLabels = Array.from({length: daysInMonth}, (_, i) => String(i + 1));
                        const presentByDay = dayLabels.map(day => monthAttendance.filter(a => {
                            const parts = String(a.tanggal || "").split("-");
                            return Number(parts[2]) === Number(day) && String(a.status || "").toLowerCase() === "hadir";
                        }).length);
                        makeChart("attendanceChart", "line", dayLabels, presentByDay, "Hadir per hari");

                        const activeEmployees = employees.filter(e => !e.status || e.status === "Active");
                        const jobs = countBy(activeEmployees, e => e.jabatan);
                        makeChart("departmentChart", "bar", jobs.map(x => x[0]), jobs.map(x => x[1]), "Karyawan");

                        const statuses = countBy(monthAttendance, a => a.status);
                        makeChart("statusChart", "pie", statuses.map(x => x[0]), statuses.map(x => x[1]), "Absensi bulan ini");

                        const employeeStatuses = countBy(employees, e => e.status || "Active");
                        makeChart("performanceChart", "doughnut", employeeStatuses.map(x => x[0]), employeeStatuses.map(x => x[1]), "Karyawan");

                        const ageGroups = {"Di bawah 18": 0, "18–25": 0, "26–35": 0, "36–45": 0, "46+": 0, "Tidak diisi": 0};
                        employees.forEach(e => {
                            if (!e.tanggalLahir) {ageGroups["Tidak diisi"]++; return;}
                            const birth = new Date(String(e.tanggalLahir) + "T00:00:00");
                            if (Number.isNaN(birth.getTime())) {ageGroups["Tidak diisi"]++; return;}
                            let age = year - birth.getFullYear();
                            if (now < new Date(year, birth.getMonth(), birth.getDate())) age--;
                            if (age < 18) ageGroups["Di bawah 18"]++;
                            else if (age <= 25) ageGroups["18–25"]++;
                            else if (age <= 35) ageGroups["26–35"]++;
                            else if (age <= 45) ageGroups["36–45"]++;
                            else ageGroups["46+"]++;
                        });
                        makeChart("ageChart", "polarArea", Object.keys(ageGroups), Object.values(ageGroups), "Karyawan");
                    } catch (error) {
                        console.error("Grafik dashboard gagal dimuat dari Firestore:", error);
                    }
                }


                /* ===== V2: HRD leave, contract monitoring, reports and governance ===== */
                window.toggleMobileNav = () => {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) sidebar.classList.toggle('is-collapsed');
                };

                // On mobile, start with a compact navigation and close it after a page is selected.
                function setupMobileNavigation() {
                    const sidebar = document.querySelector('.sidebar');
                    if (!sidebar) return;
                    if (window.matchMedia('(max-width: 768px)').matches) sidebar.classList.add('is-collapsed');
                    sidebar.addEventListener('click', (event) => {
                        const button = event.target.closest('button');
                        if (!button || button.classList.contains('mobile-toggle')) return;
                        const action = button.getAttribute('onclick') || '';
                        if (!action.startsWith('toggleMenu') && window.matchMedia('(max-width: 768px)').matches) {
                            sidebar.classList.add('is-collapsed');
                        }
                    });
                }
                setupMobileNavigation();

                // Pusat Laporan: hanya tampilkan kolom bisnis yang ramah pengguna.
                // ID dokumen Firestore, UID, metadata teknis, dan objek internal tidak ditampilkan.
                const erpReportCollections = {
                    employees: {
                        label: 'Data Karyawan', collection: 'employees', fields: [
                            ['kodeKaryawan', 'NIK / Kode Karyawan', ['kodeKaryawan', 'nikKaryawan', 'nomorIndukKaryawan', 'nip']],
                            ['namaKaryawan', 'Nama Karyawan', ['namaKaryawan', 'nama', 'name']],
                            ['jabatan', 'Jabatan', ['jabatan', 'position']], ['departemen', 'Departemen', ['departemen', 'department']],
                            ['jenisKelamin', 'Jenis Kelamin', ['jenisKelamin', 'gender']], ['tanggalMulaiKerja', 'Tanggal Masuk', ['tanggalMulaiKerja', 'tanggalMasuk', 'joinDate']],
                            ['jenisKontrak', 'Jenis Kontrak', ['jenisKontrak']], ['tanggalBerakhirKontrak', 'Akhir Kontrak', ['tanggalBerakhirKontrak', 'tanggalAkhirKontrak']],
                            ['status', 'Status Karyawan', ['status']], ['totalUpahBulanan', 'Total Upah Bulanan', ['totalUpahBulanan']],
                            ['email', 'Email', ['email', 'emailKaryawan']], ['nomorTelepon', 'Nomor Telepon', ['nomorTelepon', 'noTelepon', 'telepon', 'phone']]
                        ]
                    },
                    attendance: {
                        label: 'Data Absensi', collection: 'attendance', fields: [
                            ['tanggal', 'Tanggal', ['tanggal', 'date']], ['kodeKaryawan', 'Kode Karyawan', ['kodeKaryawan', 'employeeCode', 'nikKaryawan']],
                            ['namaKaryawan', 'Nama Karyawan', ['namaKaryawan', 'nama', 'employeeName']], ['jabatan', 'Jabatan', ['jabatan']],
                            ['jamMasuk', 'Jam Masuk', ['jamMasuk', 'checkIn', 'waktuMasuk']], ['jamPulang', 'Jam Pulang', ['jamPulang', 'checkOut', 'waktuPulang']],
                            ['status', 'Status Absensi', ['status', 'statusAbsensi', 'keterangan']], ['terlambatMenit', 'Terlambat (menit)', ['terlambatMenit', 'menitTerlambat']],
                            ['jamKerja', 'Jam Kerja', ['jamKerja', 'totalJamKerja']], ['catatan', 'Catatan', ['catatan', 'keteranganTambahan']]
                        ]
                    },
                    salary: {
                        label: 'Data Payroll', collection: 'salary', fields: [
                            ['periode', 'Periode', ['periode', 'bulanTahun', 'bulanPayroll']], ['kodeKaryawan', 'Kode Karyawan', ['kodeKaryawan', 'nikKaryawan']],
                            ['namaKaryawan', 'Nama Karyawan', ['namaKaryawan', 'nama']], ['jabatan', 'Jabatan', ['jabatan']],
                            ['upahPokok', 'Upah Pokok', ['upahPokok', 'gajiPokok', 'basicSalary', 'gajiPokokBulanan']],
                            ['tunjangan', 'Tunjangan', ['tunjangan', 'totalTunjangan', 'tunjanganBulanan']], ['lembur', 'Lembur', ['lembur', 'upahLembur']],
                            ['potonganAbsensi', 'Potongan Absensi', ['potonganAbsensi']], ['potonganKoperasi', 'Potongan Koperasi', ['potonganKoperasi', 'potonganPinjaman']],
                            ['totalPotongan', 'Total Potongan', ['totalPotongan', 'potongan']], ['gajiBersih', 'Gaji Bersih', ['gajiBersih', 'totalGaji', 'netSalary']],
                            ['status', 'Status Payroll', ['status']]
                        ]
                    },
                    members: {
                        label: 'Anggota Koperasi', collection: 'koperasiAnggota', fields: [
                            ['idKoperasi', 'ID Anggota', ['idKoperasi', 'nomorAnggota']], ['namaKaryawan', 'Nama Anggota', ['namaKaryawan', 'nama', 'namaAnggota']],
                            ['jabatan', 'Jabatan', ['jabatan']], ['departemen', 'Departemen', ['departemen']], ['tanggalBergabung', 'Tanggal Bergabung', ['tanggalBergabung', 'tanggal']],
                            ['status', 'Status Anggota', ['status']], ['saldoSimpanan', 'Saldo Simpanan', ['saldoSimpanan']]
                        ]
                    },
                    savings: {
                        label: 'Transaksi Simpanan', collection: 'koperasiSimpanan', fields: [
                            ['tanggal', 'Tanggal Transaksi', ['tanggal']], ['idKoperasi', 'ID Anggota', ['idKoperasi']], ['namaKaryawan', 'Nama Anggota', ['namaKaryawan', 'namaAnggota']],
                            ['tipeTransaksi', 'Jenis Transaksi', ['tipeTransaksi', 'jenisTransaksi', 'jenisSimpanan']], ['kategoriSimpanan', 'Kategori Simpanan', ['kategoriSimpanan', 'jenisSimpanan']],
                            ['nominal', 'Nominal (Rp)', ['nominal']], ['keterangan', 'Keterangan', ['keterangan']]
                        ]
                    },
                    loans: {
                        label: 'Data Pinjaman', collection: 'koperasiPinjaman', fields: [
                            ['nomorSPH', 'Nomor SPH', ['nomorSPH', 'sph']], ['tanggal', 'Tanggal Pinjaman', ['tanggal']], ['idKoperasi', 'ID Anggota', ['idKoperasi']],
                            ['namaKaryawan', 'Nama Anggota', ['namaKaryawan', 'namaAnggota']], ['nominal', 'Pokok Pinjaman (Rp)', ['nominal']], ['tenor', 'Tenor (bulan)', ['tenor']],
                            ['rateBulanan', 'Bunga per Bulan (%)', ['rateBulanan']], ['angsuranPokokBulanan', 'Pokok per Bulan (Rp)', ['angsuranPokokBulanan']],
                            ['bungaBulanan', 'Bunga per Bulan (Rp)', ['bungaBulanan']], ['angsuranBulanan', 'Angsuran per Bulan (Rp)', ['angsuranBulanan']],
                            ['totalPengembalian', 'Total Pengembalian (Rp)', ['totalPengembalian']], ['totalTerbayar', 'Sudah Dibayar (Rp)', ['totalTerbayar']],
                            ['sisaKewajiban', 'Sisa Kewajiban (Rp)', ['sisaKewajiban']], ['status', 'Status Pinjaman', ['status']]
                        ]
                    },
                    repayments: {
                        label: 'Setoran Pinjaman', collection: 'koperasiSetoranPinjaman', fields: [
                            ['tanggal', 'Tanggal Setoran', ['tanggal']], ['nomorSPH', 'Nomor SPH', ['nomorSPH', 'sph']], ['idKoperasi', 'ID Anggota', ['idKoperasi']],
                            ['namaKaryawan', 'Nama Anggota', ['namaKaryawan', 'namaAnggota']], ['angsuranKe', 'Angsuran Ke', ['angsuranKe']],
                            ['nominalSetoran', 'Total Setoran (Rp)', ['nominalSetoran', 'nominal']], ['pokokDibayar', 'Pokok Dibayar (Rp)', ['pokokDibayar']],
                            ['bungaDibayar', 'Bunga Dibayar (Rp)', ['bungaDibayar']], ['sisaPokok', 'Sisa Pokok (Rp)', ['sisaPokok']],
                            ['sisaKewajiban', 'Sisa Kewajiban (Rp)', ['sisaKewajiban']]
                        ]
                    },
                    leave: {
                        label: 'Permohonan Cuti & Izin', collection: 'leaveRequests', fields: [
                            ['kodeKaryawan', 'Kode Karyawan', ['kodeKaryawan']], ['namaKaryawan', 'Nama Karyawan', ['namaKaryawan']], ['jenis', 'Jenis Pengajuan', ['jenis']],
                            ['tanggalMulai', 'Tanggal Mulai', ['tanggalMulai']], ['tanggalSelesai', 'Tanggal Selesai', ['tanggalSelesai']],
                            ['jumlahHari', 'Jumlah Hari', ['jumlahHari']], ['alasan', 'Alasan', ['alasan']], ['status', 'Status Persetujuan', ['status']]
                        ]
                    },
                    contracts: {
                        label: 'Riwayat Kontrak Kerja', collection: 'employeeContracts', fields: [
                            ['nomorKontrak', 'Nomor Kontrak', ['nomorKontrak']], ['kodeKaryawan', 'Kode Karyawan', ['kodeKaryawan']], ['namaKaryawan', 'Nama Karyawan', ['namaKaryawan']],
                            ['jenisKontrak', 'Jenis Kontrak', ['jenisKontrak']], ['tanggalMulai', 'Tanggal Mulai', ['tanggalMulai']], ['tanggalAkhir', 'Tanggal Akhir', ['tanggalAkhir']],
                            ['jabatan', 'Jabatan', ['jabatan']], ['departemen', 'Departemen', ['departemen']], ['upahPokokBulanan', 'Upah Pokok (Rp)', ['upahPokokBulanan']],
                            ['tunjanganBulanan', 'Tunjangan (Rp)', ['tunjanganBulanan']], ['totalUpahBulanan', 'Total Upah (Rp)', ['totalUpahBulanan']], ['status', 'Status Kontrak', ['status']]
                        ]
                    }
                };
                let activeReportRows = [];
                let activeReportMeta = null;
                let activeReportDisplayRows = [];
                const erpFormatDate = (value) => {
                    if (!value) return '';
                    if (typeof value === 'string') {
                        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
                        return value;
                    }
                    if (value && typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
                    if (value instanceof Date) return value.toISOString().slice(0, 10);
                    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString().slice(0, 10);
                    return String(value);
                };
                const erpEscapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
                const erpSafeCsvCell = (value) => {
                    let s = value == null ? '' : String(value);
                    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
                    return '"' + s.replace(/"/g, '""') + '"';
                };
                function erpDownloadBlob(content, filename, type) {
                    const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = filename;
                    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
                function erpReportValue(row, candidates) {
                    for (const key of candidates) if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
                    return '';
                }
                function erpFormatReportValue(value, label) {
                    if (value === undefined || value === null) return '';
                    if (value && typeof value === 'object') return erpFormatDate(value);
                    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
                    if (/Bunga per Bulan \( %\)/i.test(label) || /Bunga per Bulan \(\%\)/i.test(label)) {const n = Number(value); return Number.isFinite(n) ? `${n}%` : String(value);}
                    if (/(Rp\)|Upah|Gaji|Nominal|Pokok|Bunga|Setoran|Pengembalian|Dibayar|Potongan|Tunjangan|Kewajiban|Simpanan)/i.test(label) && value !== '') {
                        const n = Number(value); if (Number.isFinite(n)) return new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(n);
                    }
                    if (/Tenor|Jumlah Hari|Angsuran Ke|Terlambat \(menit\)/i.test(label) && value !== '') return String(value);
                    return erpFormatDate(value);
                }
                function erpMakeReportRows(rawRows, meta) {
                    return rawRows.map(row => {
                        const out = {};
                        meta.fields.forEach(([key, label, candidates]) => {out[label] = erpFormatReportValue(erpReportValue(row, candidates), label);});
                        return out;
                    });
                }
                window.showReportCenter = () => {
                    document.getElementById('content').innerHTML = `
      <div class="card">
        <h2><i class="fa-solid fa-file-circle-check"></i> Pusat Laporan</h2>
        <p>Pilih modul untuk menampilkan kolom informasi yang relevan. ID dokumen internal Firestore, UID, dan metadata teknis tidak ditampilkan dalam laporan.</p>
        <div class="report-toolbar">
          <div class="form-group"><label for="erpReportType">Jenis Laporan</label><select id="erpReportType">${Object.entries(erpReportCollections).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
          <div class="form-group"><label for="erpReportSearch">Pencarian (opsional)</label><input id="erpReportSearch" placeholder="Nama, kode karyawan, status, nomor SPH..."></div>
          <button onclick="loadERPReport()"><i class="fa-solid fa-magnifying-glass"></i> Tampilkan Data</button>
        </div>
        <div class="feature-grid">
          <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-file-csv"></i></div><h3>Ekspor CSV / Excel</h3><p>Ekspor kolom laporan yang ramah pengguna; dapat dibuka di Excel.</p><button onclick="exportERPReportCSV()">Unduh CSV</button></div>
          <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-file-pdf"></i></div><h3>Ringkasan PDF</h3><p>Unduh laporan berformat rapi dengan judul kolom yang mudah dibaca.</p><button onclick="exportERPReportPDF()">Unduh PDF</button></div>
          <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-shield-halved"></i></div><h3>Privasi laporan</h3><p>Laporan hanya menampilkan kolom bisnis yang telah ditentukan untuk setiap modul.</p><span class="status-pill">Kolom terpilih</span></div>
        </div>
        <div id="erpReportStatus" class="audit-note">Pilih laporan, kemudian klik Tampilkan Data. Data belum dimuat.</div>
        <div class="table-container" style="margin-top:16px"><table><thead id="erpReportHead"><tr><th>Kolom laporan</th></tr></thead><tbody id="erpReportBody"><tr><td>Belum ada data laporan.</td></tr></tbody></table></div>
      </div>`;
                };
                window.loadERPReport = async () => {
                    const type = document.getElementById('erpReportType')?.value; const meta = erpReportCollections[type]; if (!meta) return;
                    const status = document.getElementById('erpReportStatus'), body = document.getElementById('erpReportBody');
                    if (status) status.textContent = 'Memuat data laporan...'; if (body) body.innerHTML = '<tr><td>Memuat...</td></tr>';
                    try {
                        const snap = await getDocs(collection(db, meta.collection));
                        let rawRows = snap.docs.map(d => d.data());
                        const search = String(document.getElementById('erpReportSearch')?.value || '').trim().toLowerCase();
                        let displayRows = erpMakeReportRows(rawRows, meta);
                        if (search) displayRows = displayRows.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(search)));
                        const sortLabel = meta.fields.find(f => ['Tanggal', 'Tanggal Transaksi', 'Tanggal Pinjaman', 'Tanggal Setoran', 'Tanggal Mulai', 'Periode'].includes(f[1]))?.[1];
                        if (sortLabel) displayRows.sort((a, b) => String(b[sortLabel] || '').localeCompare(String(a[sortLabel] || '')));
                        activeReportRows = displayRows; activeReportMeta = meta; activeReportDisplayRows = displayRows;
                        const headers = meta.fields.map(f => f[1]);
                        const head = document.getElementById('erpReportHead');
                        if (head) head.innerHTML = `<tr>${headers.map(h => `<th>${erpEscapeHTML(h)}</th>`).join('')}</tr>`;
                        if (body) body.innerHTML = displayRows.slice(0, 100).map(row => `<tr>${headers.map(h => `<td>${erpEscapeHTML(row[h])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${headers.length}">Tidak ada data yang cocok.</td></tr>`;
                        if (status) status.textContent = `${meta.label}: ${displayRows.length} record ditemukan. Pratinjau maksimum 100 baris; ekspor mencakup seluruh hasil filter. Kolom internal Firestore tidak disertakan.`;
                    } catch (error) {
                        console.error('Gagal memuat laporan:', error); activeReportRows = []; activeReportMeta = null;
                        if (status) status.textContent = `Gagal membaca data laporan. Periksa koneksi dan izin Firestore. ${error.message}`;
                        if (body) body.innerHTML = '<tr><td>Data tidak dapat dimuat.</td></tr>';
                    }
                };
                window.exportERPReportCSV = () => {
                    if (!activeReportMeta || !activeReportRows.length) return alert('Muat laporan terlebih dahulu dan pastikan ada data untuk diekspor.');
                    const headers = activeReportMeta.fields.map(f => f[1]);
                    const lines = [headers.map(erpSafeCsvCell).join(','), ...activeReportRows.map(row => headers.map(h => erpSafeCsvCell(row[h])).join(','))];
                    erpDownloadBlob('\ufeff' + lines.join('\r\n'), `Jeffan_ERP_${activeReportMeta.collection}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
                };
                window.exportERPReportPDF = () => {
                    if (!activeReportMeta || !activeReportRows.length) return alert('Muat laporan terlebih dahulu dan pastikan ada data untuk diekspor.');
                    if (!window.jspdf?.jsPDF) return alert('Library PDF belum termuat. Periksa koneksi internet, lalu coba kembali.');
                    const pdf = new window.jspdf.jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'}); const rows = activeReportRows; const headers = activeReportMeta.fields.map(f => f[1]);
                    pdf.setFillColor(16, 29, 50); pdf.rect(0, 0, 297, 28, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(15); pdf.text('JEFFAN INTERNATIONAL INC.', 14, 12); pdf.setFontSize(10); pdf.text(activeReportMeta.label, 14, 21);
                    pdf.setTextColor(40, 52, 70); pdf.setFontSize(8); pdf.text(`Dibuat: ${new Date().toLocaleString('id-ID')} | Total record: ${rows.length}`, 14, 35);
                    const usableWidth = 269, colW = usableWidth / Math.max(headers.length, 1); let y = 44;
                    const drawHeader = () => {pdf.setFillColor(235, 239, 245); pdf.rect(14, y - 5, usableWidth, 9, 'F'); pdf.setFontSize(6.5); pdf.setTextColor(35, 52, 75); headers.forEach((h, i) => pdf.text(String(h).slice(0, 28), 14 + i * colW, y, {maxWidth: Math.max(colW - 2, 8)})); y += 7;};
                    drawHeader();
                    rows.forEach((row, idx) => {
                        if (y > 190) {pdf.addPage(); y = 18; drawHeader();}
                        if (idx % 2 === 0) {pdf.setFillColor(248, 250, 252); pdf.rect(14, y - 4, usableWidth, 7, 'F');}
                        pdf.setFontSize(6); pdf.setTextColor(45, 55, 72); headers.forEach((h, i) => {const val = String(row[h] ?? '').replace(/[\r\n]+/g, ' '); pdf.text(val.slice(0, 45), 14 + i * colW, y, {maxWidth: Math.max(colW - 2, 8)});}); y += 7;
                    });
                    pdf.save(`Jeffan_ERP_${activeReportMeta.collection}_${new Date().toISOString().slice(0, 10)}.pdf`);
                };

                window.showLeaveManagement = async () => {
                    const content = document.getElementById('content');
                    content.innerHTML = `<div class="card"><h2><i class="fa-solid fa-calendar-days"></i> Permohonan Cuti & Izin</h2><p>Catat pengajuan cuti, sakit, izin pribadi, atau keperluan lainnya. Pengajuan tersimpan sebagai Pending dan belum otomatis mengubah absensi atau payroll.</p>
      <div class="employee-form-grid">
        <div class="form-group"><label>Karyawan</label><select id="leaveEmployee"><option value="">-- Pilih karyawan --</option></select></div>
        <div class="form-group"><label>Jenis Pengajuan</label><select id="leaveType"><option>Cuti Tahunan</option><option>Sakit</option><option>Izin Pribadi</option><option>Izin Keluarga</option><option>Lainnya</option></select></div>
        <div class="form-group"><label>Tanggal Mulai</label><input type="date" id="leaveStart"></div>
        <div class="form-group"><label>Tanggal Selesai</label><input type="date" id="leaveEnd"></div>
        <div class="form-group" style="grid-column:1/-1"><label>Alasan / Catatan</label><textarea id="leaveReason" rows="3" placeholder="Tuliskan alasan pengajuan"></textarea></div>
      </div><br><button onclick="saveLeaveRequest()"><i class="fa-solid fa-paper-plane"></i> Simpan Pengajuan</button> <button class="back-btn" onclick="loadLeaveRequests()">Muat Ulang</button></div>
      <div class="card"><h2>Riwayat Pengajuan</h2><div class="table-container"><table><thead><tr><th>Tanggal Pengajuan</th><th>ID Karyawan</th><th>Nama</th><th>Jenis</th><th>Periode</th><th>Hari</th><th>Alasan</th><th>Status</th></tr></thead><tbody id="leaveRequestRows"><tr><td colspan="8">Memuat...</td></tr></tbody></table></div></div>`;
                    try {
                        const snap = await getDocs(collection(db, 'employees'));
                        const select = document.getElementById('leaveEmployee');
                        snap.docs.map(d => ({id: d.id, ...d.data()})).filter(e => !e.status || String(e.status).toLowerCase() === 'active').sort((a, b) => String(a.namaKaryawan || '').localeCompare(String(b.namaKaryawan || ''))).forEach(e => {
                            const opt = document.createElement('option'); opt.value = e.id; opt.textContent = `${e.kodeKaryawan || e.id} — ${e.namaKaryawan || 'Tanpa nama'}`; opt.dataset.code = e.kodeKaryawan || e.id; opt.dataset.name = e.namaKaryawan || ''; select.appendChild(opt);
                        });
                        await loadLeaveRequests();
                    } catch (error) {console.error(error); alert('Data karyawan/pengajuan tidak dapat dimuat: ' + error.message);}
                };
                window.saveLeaveRequest = async () => {
                    const select = document.getElementById('leaveEmployee'); const employeeId = select?.value;
                    const start = document.getElementById('leaveStart')?.value; const end = document.getElementById('leaveEnd')?.value;
                    const reason = document.getElementById('leaveReason')?.value.trim();
                    if (!employeeId) return alert('Pilih karyawan terlebih dahulu.');
                    if (!start || !end || end < start) return alert('Periksa tanggal mulai dan selesai.');
                    if (!reason) return alert('Alasan pengajuan wajib diisi.');
                    const opt = select.options[select.selectedIndex];
                    const days = Math.floor((new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')) / 86400000) + 1;
                    try {
                        await addDoc(collection(db, 'leaveRequests'), {employeeDocId: employeeId, kodeKaryawan: opt.dataset.code || '', namaKaryawan: opt.dataset.name || '', jenis: document.getElementById('leaveType').value, tanggalMulai: start, tanggalSelesai: end, jumlahHari: days, alasan: reason, status: 'Pending', diajukanOleh: auth.currentUser?.uid || '', emailPengaju: auth.currentUser?.email || '', tanggalPengajuan: new Date(), createdAt: new Date()});
                        alert('Pengajuan tersimpan dengan status Pending. Persetujuan dan pembaruan absensi masih harus dilakukan melalui proses persetujuan yang ditetapkan.');
                        document.getElementById('leaveReason').value = ''; await loadLeaveRequests();
                    } catch (error) {console.error(error); alert('Pengajuan gagal disimpan: ' + error.message);}
                };
                window.loadLeaveRequests = async () => {
                    const body = document.getElementById('leaveRequestRows'); if (!body) return;
                    try {
                        const snap = await getDocs(collection(db, 'leaveRequests'));
                        const rows = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => String(b.tanggalPengajuan || b.createdAt || '').localeCompare(String(a.tanggalPengajuan || a.createdAt || '')));
                        body.textContent = '';
                        if (!rows.length) {body.innerHTML = '<tr><td colspan="8">Belum ada pengajuan.</td></tr>'; return;}
                        rows.forEach(r => {const tr = document.createElement('tr'); const vals = [erpFormatDate(r.tanggalPengajuan || r.createdAt), r.kodeKaryawan, r.namaKaryawan, r.jenis, `${r.tanggalMulai || ''} – ${r.tanggalSelesai || ''}`, r.jumlahHari, r.alasan, r.status || 'Pending']; vals.forEach(v => {const td = document.createElement('td'); td.textContent = v ?? ''; tr.appendChild(td);}); body.appendChild(tr);});
                    } catch (error) {console.error(error); body.innerHTML = '<tr><td colspan="8">Tidak dapat membaca koleksi leaveRequests. Periksa Firestore Rules.</td></tr>';}
                };

                const contractEscape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
                const contractDate = (v) => {
                    if (!v) return '';
                    if (typeof v === 'string') return v.slice(0, 10);
                    if (v && typeof v.toDate === 'function') return v.toDate().toISOString().slice(0, 10);
                    if (v instanceof Date) return v.toISOString().slice(0, 10);
                    return String(v).slice(0, 10);
                };
                let contractEmployeeCache = [];
                let contractRecordCache = [];
                const contractMoney = (value) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(Number(value || 0));
                window.updateContractCompensation = () => {
                    const basic = Math.max(0, Number(document.getElementById('contractWage')?.value || 0));
                    const allowance = Math.max(0, Number(document.getElementById('contractAllowance')?.value || 0));
                    const total = basic + allowance;
                    const out = document.getElementById('contractTotalWage');
                    if (out) out.value = contractMoney(total);
                    return {basic, allowance, total};
                };

                window.showContractMonitor = async () => {
                    const content = document.getElementById('content');
                    content.innerHTML = `<div class="card">
      <h2><i class="fa-solid fa-file-signature"></i> Kontrak Kerja & Pembaruan Masa Kerja</h2>
      <p>Input kontrak baru atau pembaruan kontrak, simpan riwayat perjanjian, dan cetak dokumen untuk ditinjau serta ditandatangani. Pastikan ketentuan final diperiksa HRD/legal sesuai aturan ketenagakerjaan yang berlaku.</p>
      <div class="audit-note"><strong>Catatan dokumen:</strong> template ini adalah draf umum, bukan nasihat hukum. Untuk PKWT, gunakan ketentuan, format, kompensasi, dan proses pencatatan yang sesuai aturan yang berlaku; jangan menandatangani sebelum diperiksa HRD/legal.</div>
      <h3 style="margin:20px 0 12px">Input / Pembaruan Kontrak</h3>
      <div class="employee-form-grid">
        <div class="form-group"><label for="contractEmployee">Karyawan *</label><select id="contractEmployee"><option value="">Memuat karyawan...</option></select></div>
        <div class="form-group"><label for="contractNumber">Nomor Kontrak *</label><input id="contractNumber" placeholder="Contoh: HRD/PKWT/2026/001"></div>
        <div class="form-group"><label for="contractType">Jenis Perjanjian *</label><select id="contractType"><option value="PKWT">PKWT (Waktu Tertentu)</option><option value="PKWTT">PKWTT (Waktu Tidak Tertentu)</option></select></div>
        <div class="form-group"><label for="contractStart">Tanggal Mulai *</label><input id="contractStart" type="date"></div>
        <div class="form-group"><label for="contractEnd">Tanggal Akhir</label><input id="contractEnd" type="date"></div>
        <div class="form-group"><label for="contractPosition">Jabatan dalam Kontrak *</label><input id="contractPosition" placeholder="Jabatan karyawan"></div>
        <div class="form-group"><label for="contractDepartment">Departemen</label><input id="contractDepartment" placeholder="Departemen"></div>
        <div class="form-group"><label for="contractWage">Upah Pokok Bulanan (Rp) *</label><input id="contractWage" type="number" min="0" step="1000" inputmode="numeric" placeholder="Contoh: 4000000"></div>
        <div class="form-group"><label for="contractAllowance">Tunjangan Bulanan (Rp)</label><input id="contractAllowance" type="number" min="0" step="1000" inputmode="numeric" placeholder="Contoh: 500000" value="0"><small class="field-hint">Total tunjangan bulanan selain upah pokok.</small></div>
        <div class="form-group contract-total-field"><label for="contractTotalWage">Total Upah Bulanan (Rp)</label><input id="contractTotalWage" type="text" readonly value="Rp0" aria-live="polite"><small class="field-hint">Upah pokok + tunjangan bulanan.</small></div>
        <div class="form-group"><label for="contractWorkplace">Lokasi Kerja</label><input id="contractWorkplace" placeholder="Lokasi kerja"></div>
        <div class="form-group" style="grid-column:1/-1"><label for="contractNotes">Catatan / Ketentuan Khusus</label><textarea id="contractNotes" rows="3" placeholder="Ketentuan khusus yang telah disepakati (opsional)"></textarea></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button onclick="saveEmploymentContract()"><i class="fa-solid fa-floppy-disk"></i> Simpan Kontrak</button><button class="back-btn" onclick="previewEmploymentContract()"><i class="fa-solid fa-file-pdf"></i> Pratinjau / Cetak PDF</button><button class="back-btn" onclick="resetContractForm()">Kosongkan Form</button></div>
      <p id="contractFormStatus" class="audit-note" style="margin-top:12px">Pilih karyawan untuk mengisi data awal kontrak.</p>
    </div>
    <div class="card"><h2>Monitoring & Riwayat Kontrak</h2><p>Daftar kontrak yang tersimpan. Pembaruan kontrak dibuat sebagai record baru agar riwayat sebelumnya tetap ada.</p><div id="contractMonitorStatus" class="audit-note">Memuat kontrak...</div><div class="table-container" style="margin-top:16px"><table><thead><tr><th>No. Kontrak</th><th>ID Karyawan</th><th>Nama</th><th>Jenis</th><th>Jabatan</th><th>Total Upah</th><th>Mulai</th><th>Akhir</th><th>Sisa Hari</th><th>Status</th><th>Dokumen</th></tr></thead><tbody id="contractMonitorRows"><tr><td colspan="11">Memuat...</td></tr></tbody></table></div></div>`;
                    try {
                        const snap = await getDocs(collection(db, 'employees'));
                        contractEmployeeCache = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => String(a.namaKaryawan || '').localeCompare(String(b.namaKaryawan || '')));
                        const select = document.getElementById('contractEmployee'); select.innerHTML = '<option value="">-- Pilih karyawan --</option>';
                        contractEmployeeCache.forEach(e => {const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.kodeKaryawan || e.id} — ${e.namaKaryawan || 'Tanpa nama'}`; select.appendChild(o);});
                        select.addEventListener('change', () => {
                            const e = contractEmployeeCache.find(x => x.id === select.value); if (!e) return;
                            document.getElementById('contractPosition').value = e.jabatan || e.posisi || '';
                            document.getElementById('contractDepartment').value = e.departemen || e.department || '';
                            document.getElementById('contractWorkplace').value = e.lokasiKerja || e.tempatKerja || '';
                            const end = e.tanggalBerakhirKontrak || e.tanggalAkhirKontrak || e.akhirKontrak || e.tanggalKontrakBerakhir || e.contractEndDate || '';
                            document.getElementById('contractEnd').value = contractDate(end);
                            // Pre-fill compensation from employee master when those fields exist.
                            const basic = e.upahPokokBulanan ?? e.gajiPokok ?? e.upahPokok ?? '';
                            const allowance = e.tunjanganBulanan ?? e.totalTunjangan ?? e.tunjangan ?? 0;
                            if (basic !== '') document.getElementById('contractWage').value = Number(basic) || 0;
                            document.getElementById('contractAllowance').value = Number(allowance) || 0;
                            window.updateContractCompensation();
                            document.getElementById('contractFormStatus').textContent = 'Data karyawan dimuat. Periksa dan lengkapi nomor, tanggal, serta komponen upah sebelum disimpan.';
                        });
                        ['contractWage', 'contractAllowance'].forEach(id => document.getElementById(id)?.addEventListener('input', window.updateContractCompensation));
                        window.updateContractCompensation();
                        await loadEmploymentContracts();
                    } catch (error) {console.error(error); const st = document.getElementById('contractMonitorStatus'); if (st) st.textContent = 'Gagal membaca data karyawan/kontrak. Periksa koneksi dan Firestore Rules: ' + error.message;}
                };

                window.resetContractForm = () => {
                    ['contractEmployee', 'contractNumber', 'contractStart', 'contractEnd', 'contractPosition', 'contractDepartment', 'contractWage', 'contractAllowance', 'contractWorkplace', 'contractNotes'].forEach(id => {const e = document.getElementById(id); if (e) e.value = '';});
                    const t = document.getElementById('contractType'); if (t) t.value = 'PKWT';
                    const st = document.getElementById('contractFormStatus'); if (st) st.textContent = 'Form dikosongkan.';
                    const allowance = document.getElementById('contractAllowance'); if (allowance) allowance.value = '0';
                    window.updateContractCompensation();
                };

                window.saveEmploymentContract = async () => {
                    const employeeId = document.getElementById('contractEmployee')?.value;
                    const employee = contractEmployeeCache.find(e => e.id === employeeId);
                    const number = document.getElementById('contractNumber')?.value.trim();
                    const type = document.getElementById('contractType')?.value;
                    const start = document.getElementById('contractStart')?.value;
                    const end = document.getElementById('contractEnd')?.value;
                    const position = document.getElementById('contractPosition')?.value.trim();
                    const wage = Number(document.getElementById('contractWage')?.value || 0);
                    const allowance = Number(document.getElementById('contractAllowance')?.value || 0);
                    const totalWage = wage + allowance;
                    if (!employee) return alert('Pilih karyawan.');
                    if (!number || !type || !start || !position) return alert('Nomor kontrak, jenis perjanjian, tanggal mulai, dan jabatan wajib diisi.');
                    if (end && end < start) return alert('Tanggal akhir tidak boleh lebih awal daripada tanggal mulai.');
                    if (type === 'PKWT' && !end) return alert('Untuk pencatatan PKWT, tanggal akhir harus diisi.');
                    if (wage < 0 || allowance < 0 || !Number.isFinite(wage) || !Number.isFinite(allowance)) return alert('Nominal upah pokok dan tunjangan harus berupa angka nol atau lebih.');
                    const status = document.getElementById('contractFormStatus'); if (status) status.textContent = 'Memvalidasi nomor kontrak...';
                    let contractSavedId = null;
                    try {
                        const existing = await getDocs(collection(db, 'employeeContracts'));
                        if (existing.docs.some(d => String(d.data().nomorKontrak || '').trim().toLowerCase() === number.toLowerCase())) return alert('Nomor kontrak sudah digunakan. Gunakan nomor unik.');
                        const record = {employeeDocId: employee.id, kodeKaryawan: employee.kodeKaryawan || employee.id, namaKaryawan: employee.namaKaryawan || '', nik: employee.nik || employee.noKTP || employee.nomorKTP || employee.nikKaryawan || '', alamatKaryawan: employee.alamat || employee.alamatKaryawan || employee.address || '', nomorKontrak: number, jenisKontrak: type, tanggalMulai: start, tanggalAkhir: end || '', jabatan: position, departemen: document.getElementById('contractDepartment').value.trim(), upahPokokBulanan: wage, tunjanganBulanan: allowance, totalUpahBulanan: totalWage, lokasiKerja: document.getElementById('contractWorkplace').value.trim(), catatanKhusus: document.getElementById('contractNotes').value.trim(), status: 'Draft', dibuatOleh: auth.currentUser?.uid || '', emailPembuat: auth.currentUser?.email || '', createdAt: new Date(), updatedAt: new Date()};
                        const ref = await addDoc(collection(db, 'employeeContracts'), record); contractSavedId = ref.id;
                        // Update convenience fields on employee master, while preserving the immutable contract history.
                        const employeePatch = {jenisKontrak: type, tanggalMulaiKontrak: start, tanggalBerakhirKontrak: end || '', nomorKontrakAktif: number, jabatan: position, departemen: record.departemen, upahPokokBulanan: wage, tunjanganBulanan: allowance, totalUpahBulanan: totalWage, updatedAt: new Date()};
                        await updateDoc(doc(db, 'employees', employee.id), employeePatch);
                        record.id = ref.id; window.lastEmploymentContract = record;
                        if (status) status.textContent = 'Kontrak tersimpan sebagai Draft. Periksa isi, lakukan review HRD/legal, lalu cetak untuk ditandatangani. Tanggal akhir karyawan telah diperbarui.';
                        await loadEmploymentContracts();
                        alert('Data kontrak tersimpan. Status awal Draft; dokumen perlu ditinjau dan disetujui sebelum ditandatangani.');
                    } catch (error) {console.error(error); if (status) status.textContent = contractSavedId ? 'Record kontrak tersimpan dengan ID ' + contractSavedId + ', tetapi pembaruan data induk karyawan gagal: ' + error.message + ' Periksa izin employees dan sesuaikan data induk secara manual.' : 'Gagal menyimpan kontrak: ' + error.message; alert(contractSavedId ? 'Record kontrak sudah tersimpan, tetapi tanggal pada data induk karyawan belum berhasil diperbarui. Periksa Firestore Rules dan data karyawan.' : 'Kontrak tidak berhasil disimpan. Periksa izin Firestore untuk employeeContracts dan employees.'); if (contractSavedId) await loadEmploymentContracts();}
                };

                window.loadEmploymentContracts = async () => {
                    const body = document.getElementById('contractMonitorRows'); if (!body) return;
                    try {
                        const [contractsSnap, employeeSnap] = await Promise.all([getDocs(collection(db, 'employeeContracts')), getDocs(collection(db, 'employees'))]);
                        const employees = employeeSnap.docs.map(d => ({id: d.id, ...d.data()}));
                        const contracts = contractsSnap.docs.map(d => ({id: d.id, ...d.data()}));
                        const byEmployee = new Map(contracts.map(c => [c.employeeDocId, c]));
                        // Include employee master dates if no explicit contract records exist yet.
                        employees.forEach(e => {
                            const end = e.tanggalBerakhirKontrak || e.tanggalAkhirKontrak || e.akhirKontrak || e.tanggalKontrakBerakhir || e.contractEndDate || '';
                            if (end && !byEmployee.has(e.id)) contracts.push({id: '', employeeDocId: e.id, kodeKaryawan: e.kodeKaryawan || e.id, namaKaryawan: e.namaKaryawan || '', jenisKontrak: e.jenisKontrak || '', jabatan: e.jabatan || '', tanggalMulai: e.tanggalMulaiKontrak || '', tanggalAkhir: contractDate(end), nomorKontrak: e.nomorKontrakAktif || '', status: 'Data Induk'});
                        });
                        contractRecordCache = contracts.sort((a, b) => String(a.tanggalAkhir || '9999-12-31').localeCompare(String(b.tanggalAkhir || '9999-12-31')));
                        body.innerHTML = '';
                        if (!contracts.length) {body.innerHTML = '<tr><td colspan="11">Belum ada record kontrak. Isi formulir di atas untuk membuat kontrak pertama.</td></tr>';}
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        contracts.forEach((c, i) => {
                            const end = contractDate(c.tanggalAkhir || c.tanggalBerakhirKontrak || ''); const d = end ? new Date(end + 'T00:00:00') : null; const days = d ? Math.ceil((d - today) / 86400000) : null;
                            const st = !end ? 'Belum ada akhir' : days < 0 ? 'Lewat tanggal' : days <= 30 ? 'Segera berakhir' : days <= 90 ? 'Perlu dipantau' : (c.status || 'Aman');
                            const tr = document.createElement('tr');
                            [c.nomorKontrak || '-', c.kodeKaryawan || c.employeeDocId || '', c.namaKaryawan || '', c.jenisKontrak || '', c.jabatan || '', contractMoney(c.totalUpahBulanan ?? (Number(c.upahPokokBulanan || 0) + Number(c.tunjanganBulanan || 0))), contractDate(c.tanggalMulai) || '', end || '-', days === null ? '-' : days, st].forEach(v => {const td = document.createElement('td'); td.textContent = v ?? ''; tr.appendChild(td);});
                            const td = document.createElement('td');
                            if (c.id) {const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i class="fa-solid fa-print"></i> Cetak'; b.onclick = () => previewEmploymentContract(c.id); td.appendChild(b);} else {td.textContent = 'Data lama';}
                            tr.appendChild(td); body.appendChild(tr);
                        });
                        const status = document.getElementById('contractMonitorStatus'); if (status) status.textContent = `${contracts.length} record kontrak/data masa kerja ditemukan. Kontrak baru disimpan sebagai Draft; persetujuan dan tanda tangan dilakukan di luar proses simpan ini.`;
                    } catch (error) {console.error(error); body.innerHTML = '<tr><td colspan="11">Gagal memuat riwayat kontrak. Pastikan koleksi employeeContracts dapat dibaca: ' + contractEscape(error.message) + '</td></tr>';}
                };

                window.previewEmploymentContract = async (contractId) => {
                    let c = contractId ? contractRecordCache.find(x => x.id === contractId) : null;
                    if (!c && contractId) {try {const snap = await getDoc(doc(db, 'employeeContracts', contractId)); if (snap.exists()) c = {id: snap.id, ...snap.data()};} catch (e) {console.error(e);} }
                    if (!c) {
                        const employeeId = document.getElementById('contractEmployee')?.value;
                        const e = contractEmployeeCache.find(x => x.id === employeeId);
                        if (!e) return alert('Pilih karyawan dan isi data kontrak sebelum pratinjau.');
                        c = {employeeDocId: e.id, kodeKaryawan: e.kodeKaryawan || e.id, namaKaryawan: e.namaKaryawan || '', nomorKontrak: document.getElementById('contractNumber').value.trim() || '[NOMOR KONTRAK]', jenisKontrak: document.getElementById('contractType').value, tanggalMulai: document.getElementById('contractStart').value, tanggalAkhir: document.getElementById('contractEnd').value, jabatan: document.getElementById('contractPosition').value.trim(), departemen: document.getElementById('contractDepartment').value.trim(), upahPokokBulanan: Number(document.getElementById('contractWage').value || 0), tunjanganBulanan: Number(document.getElementById('contractAllowance').value || 0), totalUpahBulanan: Number(document.getElementById('contractWage').value || 0) + Number(document.getElementById('contractAllowance').value || 0), lokasiKerja: document.getElementById('contractWorkplace').value.trim(), catatanKhusus: document.getElementById('contractNotes').value.trim()};
                    }
                    const val = (x) => contractEscape(x || '-'); const money = (n) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(Number(n || 0));
                    const endClause = c.jenisKontrak === 'PKWTT' ? 'Perjanjian ini berlaku sejak tanggal mulai kerja dan berlanjut sampai berakhir sesuai ketentuan hukum dan kebijakan perusahaan yang berlaku.' : `Perjanjian ini berlaku sejak ${val(c.tanggalMulai)} sampai dengan ${val(c.tanggalAkhir)}; pelaksanaan, perpanjangan, kompensasi, dan berakhirnya PKWT wajib mengikuti ketentuan hukum yang berlaku.`;
                    const printHtml = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Perjanjian Kerja ${val(c.nomorKontrak)}</title><style>
      @page{size:A4;margin:18mm 20mm}*{box-sizing:border-box}body{font:11pt/1.55 Arial,sans-serif;color:#172033;margin:0}.letterhead{text-align:center;border-bottom:3px double #172033;padding-bottom:10px;margin-bottom:18px}.letterhead img{width:74px;height:auto;object-fit:contain;margin-bottom:5px}.letterhead h1{font-size:17pt;letter-spacing:.6px;margin:0}.letterhead p{font-size:9pt;margin:3px 0}.doc-title{text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:18px 0 4px}.doc-no{text-align:center;margin-bottom:18px}.clause{margin:12px 0;break-inside:avoid}.clause h3{font-size:11pt;margin:0 0 4px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:34px;text-align:center;break-inside:avoid}.sign-space{height:72px}.foot{font-size:8pt;color:#555;margin-top:18px;border-top:1px solid #aaa;padding-top:8px}.draft{border:1px solid #b88b26;background:#fff8e6;padding:8px;margin-bottom:12px;font-size:9pt}@media print{button{display:none}}
      </style></head><body><div class="letterhead"><img src="https://www.jeffan.com/secure/extensions/Intente/Jeffan_21_1_0/21.1.0/img/jeffan-logo.png" alt="Logo Jeffan"><h1>JEFFAN INTERNATIONAL INC.</h1><p>Office: 1307 E. Main St, Ste 1, Chattanooga, TN 37404</p><p>Dokumen Perjanjian Kerja — Divisi Human Resources</p></div><div class="draft"><strong>DRAF UNTUK REVIEW HRD/LEGAL.</strong> Dokumen ini perlu disesuaikan dengan ketentuan ketenagakerjaan yang berlaku, peraturan perusahaan, dan kesepakatan para pihak sebelum ditandatangani.</div><div class="doc-title">PERJANJIAN KERJA ${val(c.jenisKontrak)}</div><div class="doc-no">Nomor: ${val(c.nomorKontrak)}</div><p>Pada tanggal ____________________, para pihak di bawah ini sepakat membuat perjanjian kerja sebagai berikut:</p><p><strong>PIHAK PERTAMA (PENGUSAHA)</strong><br>Jeffan International Inc., diwakili oleh pejabat perusahaan yang berwenang, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</p><p><strong>PIHAK KEDUA (KARYAWAN)</strong><br>Nama: <strong>${val(c.namaKaryawan)}</strong><br>ID Karyawan: ${val(c.kodeKaryawan)}<br>Jabatan: ${val(c.jabatan)}<br>Departemen: ${val(c.departemen)}<br>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
      <div class="clause"><h3>Pasal 1 — Jabatan dan Ruang Lingkup Pekerjaan</h3>PIHAK KEDUA bersedia melaksanakan pekerjaan sebagai ${val(c.jabatan)} pada departemen ${val(c.departemen)}, menjalankan tugas sesuai uraian jabatan, standar keselamatan, prosedur kerja, dan instruksi yang sah dari perusahaan.</div>
      <div class="clause"><h3>Pasal 2 — Masa Berlaku Perjanjian</h3>${endClause} Tanggal mulai: <strong>${val(c.tanggalMulai)}</strong>. Tanggal akhir: <strong>${val(c.tanggalAkhir || 'Sesuai ketentuan yang berlaku')}</strong>.</div>
      <div class="clause"><h3>Pasal 3 — Tempat Kerja dan Waktu Kerja</h3>Tempat kerja: ${val(c.lokasiKerja || 'sesuai penempatan perusahaan')}. Waktu kerja, istirahat, hari kerja, dan lembur mengikuti jadwal kerja serta ketentuan hukum dan kebijakan perusahaan yang berlaku.</div>
      <div class="clause"><h3>Pasal 4 — Upah, Tunjangan, dan Pembayaran</h3><p>Upah pokok bulanan: <strong>${money(c.upahPokokBulanan)}</strong>.</p><p>Tunjangan bulanan: <strong>${money(c.tunjanganBulanan ?? 0)}</strong>.</p><p>Total upah bulanan (upah pokok + tunjangan yang dicatat dalam draf ini): <strong>${money(c.totalUpahBulanan ?? (Number(c.upahPokokBulanan || 0) + Number(c.tunjanganBulanan || 0)))}</strong>.</p><p>Komponen tunjangan dan apakah bersifat tetap atau tidak tetap, waktu pembayaran, pajak, iuran, serta potongan yang sah harus dirinci dan disepakati para pihak sesuai kebijakan perusahaan dan ketentuan hukum yang berlaku. Total di atas adalah jumlah komponen yang diinput, bukan otomatis nilai bersih yang diterima setelah potongan.</p></div>
      <div class="clause"><h3>Pasal 5 — Hak Karyawan</h3>PIHAK KEDUA berhak menerima upah dan hak normatif lain sesuai perjanjian dan peraturan yang berlaku; memperoleh perlakuan yang adil, lingkungan kerja yang aman, informasi mengenai tugas dan evaluasi kerja, serta hak istirahat, cuti, jaminan sosial, dan perlindungan lain sesuai ketentuan yang berlaku.</div>
      <div class="clause"><h3>Pasal 6 — Kewajiban Karyawan</h3>PIHAK KEDUA wajib melaksanakan tugas dengan itikad baik, menaati peraturan perusahaan dan prosedur keselamatan, menjaga aset serta kerahasiaan informasi perusahaan, menyampaikan data yang benar, dan menghindari konflik kepentingan yang tidak diungkapkan.</div>
      <div class="clause"><h3>Pasal 7 — Kewajiban Perusahaan</h3>PIHAK PERTAMA wajib membayar hak karyawan sesuai ketentuan, menyediakan instruksi dan sarana kerja yang diperlukan secara wajar, menjaga data pribadi karyawan, serta melaksanakan kewajiban perusahaan berdasarkan peraturan yang berlaku.</div>
      <div class="clause"><h3>Pasal 8 — Cuti, Izin, dan Ketidakhadiran</h3>Permohonan cuti, izin, sakit, dan ketidakhadiran dilaporkan melalui prosedur perusahaan dan diproses sesuai ketentuan yang berlaku. Ketentuan cuti tidak boleh mengurangi hak normatif yang dijamin hukum.</div>
      <div class="clause"><h3>Pasal 9 — Kerahasiaan dan Aset Perusahaan</h3>PIHAK KEDUA wajib menjaga informasi rahasia yang diperoleh selama hubungan kerja dan menggunakan aset perusahaan hanya untuk tujuan yang sah. Kewajiban ini tidak menghapus hak yang diberikan oleh hukum kepada karyawan.</div>
      <div class="clause"><h3>Pasal 10 — Perubahan dan Berakhirnya Hubungan Kerja</h3>Perubahan perjanjian dibuat secara tertulis dan disepakati para pihak. Pengakhiran hubungan kerja, hak yang timbul, prosedur pemberitahuan, dan penyelesaian kewajiban mengikuti ketentuan hukum yang berlaku serta tidak mengesampingkan hak normatif.</div>
      <div class="clause"><h3>Pasal 11 — Penyelesaian Perselisihan</h3>Perselisihan diupayakan terlebih dahulu melalui musyawarah/bipartit. Jika tidak tercapai kesepakatan, penyelesaian dilakukan melalui mekanisme yang ditetapkan oleh peraturan perundang-undangan yang berlaku.</div>
      <div class="clause"><h3>Pasal 12 — Ketentuan Tambahan</h3>${val(c.catatanKhusus || 'Tidak ada ketentuan tambahan yang dicatat pada draf ini.')} Ketentuan tambahan tidak boleh bertentangan dengan hukum atau mengurangi hak normatif karyawan.</div>
      <p>Perjanjian ini dibuat dalam rangkap yang diperlukan dan masing-masing pihak memperoleh salinan setelah disetujui serta ditandatangani.</p><div class="signatures"><div>PIHAK PERTAMA<br>Jeffan International Inc.<div class="sign-space"></div><strong>________________________</strong><br>Nama & Jabatan Pejabat Berwenang</div><div>PIHAK KEDUA<br>Karyawan<br><div class="sign-space"></div><strong>${val(c.namaKaryawan)}</strong></div></div><div class="foot">Nomor kontrak: ${val(c.nomorKontrak)} • Draf dibuat melalui modul HRD. Tinjau ketentuan final bersama HRD/legal sebelum ditandatangani.</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`;
                    const w = window.open('', '_blank'); if (!w) return alert('Popup diblokir browser. Izinkan popup untuk mencetak kontrak.'); w.document.open(); w.document.write(printHtml); w.document.close();
                };

                window.showGovernanceCenter = () => {
                    const user = auth.currentUser;
                    document.getElementById('content').innerHTML = `<div class="card"><h2><i class="fa-solid fa-shield-halved"></i> Audit, Akses & Tata Kelola</h2><p>Panel pemeriksaan kesiapan operasional. Informasi di sini tidak menggantikan pengamanan di Firebase Security Rules.</p>
      <div class="audit-note"><strong>Status keamanan: perlu konfigurasi server.</strong><br>Pengaturan hak akses pada tombol/antarmuka saja tidak cukup. Firestore Security Rules harus memvalidasi UID dan peran pada setiap permintaan. Jangan menyimpan password atau kredensial rahasia di dokumen karyawan.</div>
      <div class="feature-grid">
        <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-user-lock"></i></div><h3>Sesi Pengguna</h3><p>Email sesi: ${String(user?.email || 'Tidak diketahui').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))}</p><p>UID tersedia untuk pemetaan role: ${user?.uid ? user.uid.slice(0, 8) + '…' : 'Tidak ada sesi'}</p></div>
        <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-users-gear"></i></div><h3>Role-Based Access</h3><p>Perlu menetapkan skema role resmi (Admin, HRD, Atasan, Bendahara Koperasi, Pimpinan) dan menerapkan aturan yang sama di Firestore Rules.</p><span class="status-pill">Belum disahkan</span></div>
        <div class="feature-tile"><div class="tile-icon"><i class="fa-solid fa-database"></i></div><h3>Backup & Restore</h3><p>Ekspor dari browser hanya salinan laporan. Backup produksi perlu mekanisme terkelola di Firebase/Google Cloud dan uji pemulihan.</p><span class="status-pill">Perlu konfigurasi</span></div>
      </div>
      <h3>Checklist sebelum produksi</h3><div style="display:grid;gap:10px;margin-top:12px">
        <label><input type="checkbox" disabled> Security Rules diuji untuk setiap peran</label>
        <label><input type="checkbox" disabled> Akun pengguna dipetakan ke role yang disetujui</label>
        <label><input type="checkbox" disabled> Audit log transaksi dibuat dan tidak dapat diubah oleh pengguna biasa</label>
        <label><input type="checkbox" disabled> Backup terjadwal dan restore berhasil diuji</label>
        <label><input type="checkbox" disabled> Rekonsiliasi simpanan, pinjaman, payroll, dan absensi selesai</label>
      </div><p style="margin-top:16px">Referensi resmi: <a href="https://firebase.google.com/docs/firestore/solutions/role-based-access" target="_blank" rel="noopener">Firebase Role-Based Access Control</a> · <a href="https://firebase.google.com/docs/firestore/security/get-started" target="_blank" rel="noopener">Firestore Security Rules</a></p>
    </div>`;
                };

                /* END */
                console.log("Dashboard Attendance Loaded Successfully");
