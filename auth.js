// Configuración de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

//==================== LOGIN ====================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      document.getElementById("login-error").innerText = error.message;
    } else {
       window.location.href = "perfil.html";
    }
  });
}

//==================== PERFIL ====================
if (window.location.pathname.includes("perfil.html")) {
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    currentUser = user;
    console.log("Usuario autenticado:", user);

    // Cargar libros del usuario
    await loadUserBooks(user.id);
  })();
}

//==================== LOGOUT ====================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

// ==================== FUNCIONES DE LIBROS ====================

// Mostrar libros del usuario
async function loadUserBooks(userId) {
  const contenedor = document.getElementById("mis-libros");

  // 1. Traer user_Items
  const { data: userItems, error } = await supabase
    .from("user_Items")
    .select("id_item")
    .eq("id_user", userId);

  if (error) {
    console.error("Error al traer user_Items:", error.message);
    contenedor.innerHTML = "<p>Error cargando libros</p>";
    return;
  }

  if (!userItems.length) {
    contenedor.innerHTML = "<p>No tienes libros todavía.</p>";
    return;
  }

  // 2. Traer Items asociados
  const ids = userItems.map(u => u.id_item);

  const { data: items, error: errorItems } = await supabase
    .from("Items")
    .select("id, titulo")
    .in("id", ids);

  if (errorItems) {
    console.error("Error al traer Items:", errorItems.message);
    return;
  }

  // 3. Renderizar
  contenedor.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("libro");
    div.innerHTML = `
      <h3>${item.titulo}</h3>
      <p>ID: ${item.id}</p>
    `;
    contenedor.appendChild(div);
  });
}

// Insertar libro
const addBtn = document.getElementById("add-book-btn");
if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const idLibro = document.getElementById("id-libro-add").value;
    if (!idLibro || !currentUser) return;

    const { error } = await supabase
      .from("user_Items")
      .insert([{ id_user: currentUser.id, id_item: idLibro }]);

    if (error) {
      alert("Error al insertar libro: " + error.message);
    } else {
      alert("Libro añadido correctamente.");
      loadUserBooks(currentUser.id);
    }
  });
}

// Eliminar libro
const delBtn = document.getElementById("delete-book-btn");
if (delBtn) {
  delBtn.addEventListener("click", async () => {
    const idLibro = document.getElementById("id-libro-del").value;
    if (!idLibro || !currentUser) return;

    const { error } = await supabase
      .from("user_Items")
      .delete()
      .eq("id_user", currentUser.id)
      .eq("id_item", idLibro);

    if (error) {
      alert("Error al eliminar libro: " + error.message);
    } else {
      alert("Libro eliminado correctamente.");
      loadUserBooks(currentUser.id);
    }
  });
}
