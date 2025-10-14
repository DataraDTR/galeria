import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAMlpw4MGaa4XqHKG--NZYKIh6yM8-NuqE",
  authDomain: "galeria-5e025.firebaseapp.com",
  projectId: "galeria-5e025",
  storageBucket: "galeria-5e025.appspot.com",
  messagingSenderId: "273503286623",
  appId: "1:273503286623:web:c49f7fba6c9d550ea232ea",
  measurementId: "G-34KZ77TZ8B",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM
const authSection = document.getElementById("auth-section");
const uploadSection = document.getElementById("upload-section");
const gallerySection = document.getElementById("gallery-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const fileDesc = document.getElementById("file-desc");
const gallery = document.getElementById("gallery");
const progressBar = document.getElementById("progress-bar");
const progress = document.querySelector(".progress");
const sidebarItems = document.querySelectorAll(".sidebar ul li[data-section]");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalBody = document.getElementById("modal-body");
const modalDesc = document.getElementById("modal-desc");
const modalAuthor = document.getElementById("modal-author");

let currentUser = null;
let currentSection = "all";

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email||!password) return alert("Ingresa tus datos");
  try { await signInWithEmailAndPassword(auth,email,password); }
  catch(e){ alert("Error: "+e.message); }
});

// Logout
logoutBtn.addEventListener("click", ()=>signOut(auth));

// Detectar usuario
onAuthStateChanged(auth,(user)=>{
  currentUser=user;
  if(user){
    authSection.classList.add("hidden");
    gallerySection.classList.remove("hidden");
    loadSection(currentSection);
  }else{
    authSection.classList.remove("hidden");
    gallerySection.classList.add("hidden");
  }
});

// Sidebar navigation
sidebarItems.forEach(item=>{
  item.addEventListener("click",()=>{
    sidebarItems.forEach(i=>i.classList.remove("active"));
    item.classList.add("active");
    currentSection=item.dataset.section;
    loadSection(currentSection);
  });
});

// Subir archivo
uploadBtn.addEventListener("click",async ()=>{
  const file = fileInput.files[0];
  const desc = fileDesc.value.trim();
  if(!file) return alert("Selecciona un archivo");
  const filePath = `uploads/${Date.now()}_${file.name}`;
  const fileRef = ref(storage,filePath);
  const uploadTask = uploadBytesResumable(fileRef,file);

  progressBar.classList.remove("hidden");
  uploadTask.on("state_changed",
    snap => progress.style.width = `${(snap.bytesTransferred/snap.totalBytes)*100}%`,
    err => { alert("Error:"+err.message); progressBar.classList.add("hidden"); },
    async ()=>{
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db,"media"),{
        uid: currentUser.uid,
        email: currentUser.email,
        name: file.name,
        url,
        type: file.type.startsWith("video")?"video":"image",
        desc
      });
      progressBar.classList.add("hidden");
      fileInput.value=""; fileDesc.value="";
      loadSection(currentSection);
    });
});

// Cargar sección
async function loadSection(section){
  if(section==="upload"){ uploadSection.classList.remove("hidden"); gallerySection.classList.add("hidden"); }
  else{ uploadSection.classList.add("hidden"); gallerySection.classList.remove("hidden"); loadGallery(section); }
}

// Cargar galería
async function loadGallery(section){
  const snapshot = await getDocs(collection(db,"media"));
  let items = snapshot.docs.map(d=>({id:d.id,...d.data()}));
  if(section==="favorites") items = items.filter(i=>i.favorite);
  gallery.innerHTML = items.length?items.map(i=>`
    <div class="card" onclick="openModal('${i.url}','${i.desc||''}','${i.email}')">
      ${i.type==="image"?`<img src="${i.url}"/>`:`<video src="${i.url}" controls muted></video>`}
      <div class="card-content">
        <p><strong>${i.name}</strong></p>
        ${i.desc?`<p>${i.desc}</p>`:""}
        <p style="font-size:12px;color:gray;">Subido por: ${i.email}</p>
      </div>
    </div>
  `).join(""):'<p>No hay archivos aún</p>';
}

// Modal
window.openModal=(url,desc,email)=>{
  modal.classList.remove("hidden");
  modalBody.innerHTML = url.endsWith(".mp4")?`<video src="${url}" controls autoplay></video>`:`<img src="${url}"/>`;
  modalDesc.textContent = desc;
  modalAuthor.textContent = "Subido por: "+email;
}

modalClose.addEventListener("click",()=>modal.classList.add("hidden"));
modal.addEventListener("click",e=>{if(e.target===modal) modal.classList.add("hidden");});
