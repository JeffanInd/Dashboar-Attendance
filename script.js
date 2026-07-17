import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getFirestore,collection,getDocs,addDoc,doc,deleteDoc,updateDoc,orderBy,query}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6IOPUC-6JdFGhDdLCxfupc1dye92ACr0",
  authDomain: "dashboard-attendance-c6b7d.firebaseapp.com",
  projectId: "dashboard-attendance-c6b7d",
  storageBucket: "dashboard-attendance-c6b7d.firebasestorage.app",
  messagingSenderId: "1017774629688",
  appId: "1:1017774629688:web:dd662f017b2cf0200f57cd",
  measurementId: "G-KCJQ5CKYJ3"
};

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

let editId=null;

window.login=()=>{
let email=document.getElementById("email").value;
let password=document.getElementById("password").value;
signInWithEmailAndPassword(auth,email,password)
.then(()=>{
document.getElementById("loginPage").style.display="none";
document.getElementById("dashboard").style.display="flex";
})
.catch(e=>{
document.getElementById("loginInfo").innerHTML=e.message;
});
};

onAuthStateChanged(auth,user=>{
if(user){
document.getElementById("loginPage").style.display="none";
document.getElementById("dashboard").style.display="flex";
document.getElementById("welcome").innerHTML="Halo "+user.email;
}
});

window.logout=()=>{
signOut(auth).then(()=>location.reload());
};

window.loadDashboard=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Selamat Datang di Dashboard</h2>
<p>PT. NAMA PERUSAHAAN</p>
<p>Monitoring aktivitas perusahaan secara digital.</p>
</div>`;
};

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
<button onclick="saveEmployee()">Save Data</button>
</div>
<div class="card">
<h2>Tabel Data Karyawan</h2>
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
let snap=await getDocs(collection(db,"employees"));
let nomor=snap.size+1;
let kode="KARY"+String(nomor).padStart(3,"0");
document.getElementById("kode").value=kode;
}

window.saveEmployee=async()=>{
let data={
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
loadEmployees();
generateCode();
};

async function loadEmployees(){
let tbody=document.getElementById("employeeTable");
if(!tbody)return;
tbody.innerHTML="";
let q=query(collection(db,"employees"),orderBy("kodeKaryawan"));
let snap=await getDocs(q);
snap.forEach(item=>{
let d=item.data();
tbody.innerHTML+=`
<tr>
<td>${d.kodeKaryawan}</td>
<td>${d.namaKaryawan}</td>
<td>${d.jabatan}</td>
<td>${d.tanggalLahir}</td>
<td>${d.alamat}</td>
<td>${d.pendidikanTerakhir}</td>
<td>${d.noHp}</td>
<td>${d.nomorRekening}</td>
<td>${d.bank}</td>
<td class="action">
<button class="edit" onclick="editEmployee('${item.id}')">Edit</button>
<button class="delete" onclick="deleteEmployee('${item.id}')">Delete</button>
</td>
</tr>`;
});
}

window.editEmployee=async(id)=>{
editId=id;
let snap=await getDocs(collection(db,"employees"));
snap.forEach(x=>{
if(x.id==id){
let d=x.data();
kode.value=d.kodeKaryawan;
nama.value=d.namaKaryawan;
jabatan.value=d.jabatan;
tanggalLahir.value=d.tanggalLahir;
alamat.value=d.alamat;
pendidikan.value=d.pendidikanTerakhir;
hp.value=d.noHp;
rekening.value=d.nomorRekening;
bank.value=d.bank;
}
});
window.scrollTo(0,0);
};

window.deleteEmployee=async(id)=>{
if(confirm("Hapus data karyawan?")){
await deleteDoc(doc(db,"employees",id));
loadEmployees();
}
};

function clearForm(){
nama.value="";
jabatan.value="";
tanggalLahir.value="";
alamat.value="";
pendidikan.value="";
hp.value="";
rekening.value="";
}

window.showAttendance=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Attendance</h2>
<p>Menu absensi karyawan akan dikembangkan.</p>
</div>`;
};

window.showKoperasi=()=>{
document.getElementById("content").innerHTML=`
<div class="card">
<h2>Koperasi</h2>
<p>Menu koperasi akan dikembangkan.</p>
</div>`;
};
