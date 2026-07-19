import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* ==============================
   JAM REALTIME
============================== */
function updateClock(){
const now=new Date();
const time=now.toLocaleTimeString("en-US",{hour12:false});
const day=now.toLocaleDateString("en-US",{weekday:"long"});
const date=now.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
document.querySelector(".time").innerHTML=time;
document.querySelector(".day").innerHTML="Day : "+day;
document.querySelector(".date").innerHTML=date;
}
updateClock();
setInterval(updateClock,1000);

/* ==============================
   LOGIN
============================== */

window.login = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {

            document.getElementById("loginPage").style.display = "none";
            document.getElementById("dashboard").style.display = "flex";
            const user = userCredential.user;
            document.getElementById("loginName").innerHTML = user.email;
            updateClock();
            loadDashboard();

        })

        .catch((error) => {

            document.getElementById("loginInfo").innerHTML = error.message;
        });
};

/* ==============================
   AUTH STATE
============================== */
onAuthStateChanged(auth, (user) => {
    if (user) {

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";
        document.getElementById("loginName").innerHTML = user.email;
        updateClock();
        loadDashboard();

    }

});

/* ==============================
   LOGOUT
============================== */
window.logout = () => {
    signOut(auth).then(() => {
        location.reload();
    });
};

/* ==============================
   DASHBOARD
============================== */
window.loadDashboard = () => {
    document.getElementById("content").innerHTML = `
<div class="card">
<h2>Dashboard Perusahaan</h2>
<p>Selamat datang di Sistem Informasi Perusahaan.</p>
<br>
<div class="stat-container">
<div class="stat">
<h3>120</h3>
<p>Total Karyawan</p>
</div>
<div class="stat">
<h3>115</h3>
<p>Hadir Hari Ini</p>
</div>

<div class="stat">
<h3>5</h3>
<p>Izin / Sakit</p>
</div>

</div>

</div>

`;
  window.showUtilities=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Data Karyawan</h2>
<div class="form-grid">
<input id="kode" placeholder="Kode Karyawan" readonly>
<input id="nama" placeholder="Nama Karyawan">
<input id="jabatan" placeholder="Jabatan">
<input id="tanggalLahir" type="date">
<textarea id="alamat" placeholder="Alamat"></textarea>
<input id="pendidikan" placeholder="Pendidikan Terakhir">
<input id="hp" placeholder="No HP">
<input id="rekening" placeholder="Nomor Rekening">
<select id="bank">
<option>BCA</option>
<option>Mandiri</option>
<option>BNI</option>
<option>BRI</option>
<option>CIMB Niaga</option>
<option>Danamon</option>
<option>Lainnya</option>
</select>
</div>
<div style="margin-top:20px;display:flex;gap:10px;">
<button onclick="saveEmployee()">💾 Simpan Data</button>
<button onclick="clearForm()">🧹 Reset</button>
</div>
</div>
<div class="card">
<h2>Daftar Karyawan</h2>
<div class="table-container">
<table>
<thead>
<tr>
<th>Kode</th>
<th>Nama</th>
<th>Jabatan</th>
<th>Tanggal Lahir</th>
<th>Alamat</th>
<th>Pendidikan</th>
<th>No HP</th>
<th>Rekening</th>
<th>Bank</th>
<th>Action</th>
</tr>
</thead>
<tbody id="employeeTable"></tbody>
</table>
</div>
</div>`;
generateCode();
loadEmployees();
};

async function generateCode(){
const snap=await getDocs(collection(db,"employees"));
const nomor=snap.size+1;
const kode="KARY"+String(nomor).padStart(3,"0");
const el=document.getElementById("kode");
if(el)el.value=kode;
}

window.saveEmployee=async()=>{
const data={
kodeKaryawan:document.getElementById("kode").value,
namaKaryawan:document.getElementById("nama").value,
jabatan:document.getElementById("jabatan").value,
tanggalLahir:document.getElementById("tanggalLahir").value,
alamat:document.getElementById("alamat").value,
pendidikanTerakhir:document.getElementById("pendidikan").value,
noHp:document.getElementById("hp").value,
nomorRekening:document.getElementById("rekening").value,
bank:document.getElementById("bank").value
};
if(editId){
await updateDoc(doc(db,"employees",editId),data);
editId=null;
}else{
await addDoc(collection(db,"employees"),data);
}
alert("Data berhasil disimpan");
clearForm();
generateCode();
loadEmployees();
};

async function loadEmployees(){
const tbody=document.getElementById("employeeTable");
if(!tbody)return;
tbody.innerHTML="";
const q=query(collection(db,"employees"),orderBy("kodeKaryawan"));
const snap=await getDocs(q);
snap.forEach(item=>{
const d=item.data();
tbody.innerHTML+=`
<tr>
<td>${d.kodeKaryawan||""}</td>
<td>${d.namaKaryawan||""}</td>
<td>${d.jabatan||""}</td>
<td>${d.tanggalLahir||""}</td>
<td>${d.alamat||""}</td>
<td>${d.pendidikanTerakhir||""}</td>
<td>${d.noHp||""}</td>
<td>${d.nomorRekening||""}</td>
<td>${d.bank||""}</td>
<td class="action">
<button class="edit" onclick="editEmployee('${item.id}')">Edit</button>
<button class="delete" onclick="deleteEmployee('${item.id}')">Delete</button>
</td>
</tr>`;
});
}

window.editEmployee=async(id)=>{
editId=id;
const snap=await getDocs(collection(db,"employees"));
snap.forEach(item=>{
if(item.id===id){
const d=item.data();
document.getElementById("kode").value=d.kodeKaryawan;
document.getElementById("nama").value=d.namaKaryawan;
document.getElementById("jabatan").value=d.jabatan;
document.getElementById("tanggalLahir").value=d.tanggalLahir;
document.getElementById("alamat").value=d.alamat;
document.getElementById("pendidikan").value=d.pendidikanTerakhir;
document.getElementById("hp").value=d.noHp;
document.getElementById("rekening").value=d.nomorRekening;
document.getElementById("bank").value=d.bank;
}
});
document.getElementById("content").scrollTo({
top:0,
behavior:"smooth"
});
};

window.deleteEmployee=async(id)=>{
if(confirm("Hapus data karyawan?")){
await deleteDoc(doc(db,"employees",id));
loadEmployees();
generateCode();
}
};

window.clearForm=()=>{
document.getElementById("nama").value="";
document.getElementById("jabatan").value="";
document.getElementById("tanggalLahir").value="";
document.getElementById("alamat").value="";
document.getElementById("pendidikan").value="";
document.getElementById("hp").value="";
document.getElementById("rekening").value="";
document.getElementById("bank").selectedIndex=0;
};
  async function getEmployeeCount(){
const snap=await getDocs(collection(db,"employees"));
return snap.size;
}

window.showAttendance=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Attendance</h2>
<p>Menu absensi karyawan akan dikembangkan.</p>
<div class="stat-container">
<div class="stat">
<h3>0</h3>
<p>Hadir</p>
</div>
<div class="stat">
<h3>0</h3>
<p>Izin</p>
</div>
<div class="stat">
<h3>0</h3>
<p>Sakit</p>
</div>
</div>
</div>`;
};

window.showKoperasi=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Koperasi</h2>
<p>Menu koperasi akan dikembangkan.</p>
<div class="stat-container">
<div class="stat">
<h3>Rp 0</h3>
<p>Total Simpanan</p>
</div>
<div class="stat">
<h3>Rp 0</h3>
<p>Total Pinjaman</p>
</div>
<div class="stat">
<h3>0</h3>
<p>Anggota Aktif</p>
</div>
</div>
</div>`;
};

window.loadDashboard=async()=>{
const total=await getEmployeeCount();
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Dashboard Perusahaan</h2>
<p>Selamat datang di Sistem Informasi Perusahaan.</p>
<div class="stat-container">
<div class="stat">
<h3>${total}</h3>
<p>Total Karyawan</p>
</div>
<div class="stat">
<h3 id="tanggalDashboard"></h3>
<p>Tanggal Hari Ini</p>
</div>
<div class="stat">
<h3 id="jamDashboard"></h3>
<p>Jam Sekarang</p>
</div>
</div>
</div>`;
updateDashboardTime();
};

function updateDashboardTime(){
const now=new Date();
const tgl=now.toLocaleDateString("id-ID",{
weekday:"long",
day:"2-digit",
month:"long",
year:"numeric"
});
const jam=now.toLocaleTimeString("id-ID");
const elTanggal=document.getElementById("tanggalDashboard");
const elJam=document.getElementById("jamDashboard");
if(elTanggal)elTanggal.innerHTML=tgl;
if(elJam)elJam.innerHTML=jam;
}

updateClock();
setInterval(updateClock,1000);
document.addEventListener("DOMContentLoaded",()=>{
updateClock();
const user=auth.currentUser;
if(user){
const loginName=document.getElementById("loginName");
if(loginName)loginName.innerHTML=user.email;
}
});

};
