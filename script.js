import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
getAuth,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
}
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
getFirestore,
collection,
getDocs
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Firebase Config
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
// LOGIN
window.login=function(){
let email=
document.getElementById("email").value;
let password=
document.getElementById("password").value;
signInWithEmailAndPassword(
auth,
email,
password
)
.then(()=>{
document.getElementById("loginPage")
.style.display="none";
document.getElementById("dashboard")
.style.display="block";
})
.catch(error=>{
document.getElementById("loginInfo")
.innerHTML=
error.message;
});
}
// CEK SESSION
onAuthStateChanged(auth,(user)=>{
if(user){
document.getElementById("loginPage")
.style.display="none";
document.getElementById("dashboard")
.style.display="block";
}
});
// LOGOUT
window.logout=function(){
signOut(auth)
.then(()=>{
location.reload();
});
}
// MENU
window.showMenu=function(menu){
let content=
document.getElementById("content");
content.innerHTML=
`
<h2>${menu}</h2>
<div id="data">
Loading...
</div>
`;
loadData(menu);
}
// FIRESTORE READ
async function loadData(menu){
const querySnapshot=
await getDocs(
collection(db,menu)
);
let html="";
querySnapshot.forEach((doc)=>{
html+=`
<div>
<pre>
${JSON.stringify(
doc.data(),
null,
2
)}
</pre>
</div>
<hr>
`;
});
document.getElementById("data")
.innerHTML=html;


}
