// Importar Firebase (desde CDN)
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// 🔥 Tu configuración
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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// 🔹 Referencias HTML
const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");
const uploadSection = document.getElementById("upload-section");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const gallery = document.getElementById("gallery");

let currentUser = null;

// 🔹 Autenticación Google
loginBtn.addEventListener("click", async () => {
  if (currentUser) {
    await signOut(auth);
  } else {
    await signInWithPopup(auth, provider);
  }
});

// 🔹 Detectar cambios de sesión
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userInfo.innerHTML = `
      <img src="${user.photoURL}" alt="avatar">
      <span>${user.displayName}</span>
      <button id="logout">Cerrar sesión</button>
    `;
    document.getElementById("logout").addEventListener("click", () => signOut(auth));
    uploadSection.classList.remove("hidden");
    loadGallery();
  } else {
    userInfo.innerHTML = `<button id="login-btn">Iniciar con Google</button>`;
    uploadSection.classList.add("hidden");
    gallery.innerHTML = "";
  }
});

// 🔹 Subir archivo
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file || !currentUser) return alert("Selecciona un archivo e inicia sesión.");

  const fileRef = ref(storage, `uploads/${currentUser.uid}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  const type = file.type.startsWith("video") ? "video" : "image";

  await addDoc(collection(db, "media"), {
    uid: currentUser.uid,
    name: file.name,
    url,
    type,
  });

  alert("Archivo subido ✅");
  fileInput.value = "";
  loadGallery();
});

// 🔹 Mostrar galería
async function loadGallery() {
  const snapshot = await getDocs(collection(db, "media"));
  const data = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((item) => item.uid === currentUser.uid);

  gallery.innerHTML = data
    .map(
      (item) => `
      <div class="card">
        ${
          item.type === "image"
            ? `<img src="${item.url}" alt="${item.name}" />`
            : `<video src="${item.url}" controls></video>`
        }
        <p>${item.name}</p>
        <button onclick="deleteFile('${item.id}', '${item.name}')">Eliminar</button>
      </div>
    `
    )
    .join("");
}

// 🔹 Eliminar archivo
window.deleteFile = async (id, name) => {
  if (!confirm("¿Eliminar este archivo?")) return;
  const fileRef = ref(storage, `uploads/${currentUser.uid}/${name}`);
  await deleteObject(fileRef);
  await deleteDoc(doc(db, "media", id));
  loadGallery();
};
