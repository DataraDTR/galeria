// Importar módulos Firebase
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// 🔥 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAMlpw4MGaa4XqHKG--NZYKIh6yM8-NuqE",
  authDomain: "galeria-5e025.firebaseapp.com",
  projectId: "galeria-5e025",
  storageBucket: "galeria-5e025.firebasestorage.app",
  messagingSenderId: "273503286623",
  appId: "1:273503286623:web:c49f7fba6c9d550ea232ea",
  measurementId: "G-34KZ77TZ8B",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔹 Elementos del DOM
const userInfo = document.getElementById("user-info");
const authSection = document.getElementById("auth-section");
const uploadSection = document.getElementById("upload-section");
const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const gallery = document.getElementById("gallery");
const progressBar = document.getElementById("progress-bar");
const progress = document.querySelector(".progress");
const filters = document.querySelectorAll(".filter-btn");

let currentUser = null;
let currentFilter = "all";

// 🔹 Iniciar sesión con usuarios ya creados
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!email || !password) return alert("Por favor ingresa tus datos.");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
});

// 🔹 Detectar usuario activo
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userInfo.innerHTML = `
      <span>${user.email}</span>
      <button id="logout">Cerrar sesión</button>
    `;
    document.getElementById("logout").addEventListener("click", () => signOut(auth));

    authSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    loadGallery();
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
    gallery.innerHTML = "";
    userInfo.innerHTML = "";
  }
});

// 🔹 Subir archivo
uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file || !currentUser) return alert("Selecciona un archivo e inicia sesión.");

  const filePath = `uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(fileRef, file);

  progressBar.classList.remove("hidden");

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progress.style.width = `${percent}%`;
    },
    (error) => {
      alert("Error al subir: " + error.message);
      progressBar.classList.add("hidden");
    },
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      const type = file.type.startsWith("video") ? "video" : "image";
      await addDoc(collection(db, "media"), {
        uid: currentUser.uid,
        name: file.name,
        url,
        type,
      });
      progressBar.classList.add("hidden");
      fileInput.value = "";
      loadGallery();
    }
  );
});

// 🔹 Cargar galería
async function loadGallery() {
  const snapshot = await getDocs(collection(db, "media"));
  const items = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((i) => i.uid === currentUser.uid)
    .filter((i) => currentFilter === "all" || i.type === currentFilter);

  gallery.innerHTML = items.length
    ? items
        .map(
          (i) => `
        <div class="card">
          ${i.type === "image" ? `<img src="${i.url}" />` : `<video src="${i.url}" controls></video>`}
          <p>${i.name}</p>
          <button onclick="deleteFile('${i.id}','${i.name}')">🗑️ Eliminar</button>
        </div>
      `
        )
        .join("")
    : "<p>No hay archivos aún</p>";
}

// 🔹 Eliminar archivo
window.deleteFile = async (id, name) => {
  if (!confirm("¿Eliminar este archivo?")) return;
  const fileRef = ref(storage, `uploads/${currentUser.uid}/${name}`);
  await deleteObject(fileRef);
  await deleteDoc(doc(db, "media", id));
  loadGallery();
};

// 🔹 Filtros
filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.type;
    loadGallery();
  })
);
