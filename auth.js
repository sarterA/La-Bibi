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

  // 1. Traer user_items
  const { data: userItems, error } = await supabase
    .from("user_items")
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

// ==================== AGREGAR LIBRO EXISTENTE ====================
async function agregarLibroUsuario(idItem) {
  if (!currentUser) return;

  const { error } = await supabase
    .from("user_items")
    .insert([{ id_user: currentUser.id, id_item: idItem }]);

  if (error) {
    alert("Error al añadir libro: " + error.message);
  } else {
    alert("Libro añadido correctamente.");
    loadUserBooks(currentUser.id);
  }
}

// ==================== NUEVO LIBRO ====================
const nuevoBtn = document.getElementById("agregar-nuevo-btn");
const nuevoForm = document.getElementById("nuevo-libro-form");
if (nuevoBtn) {
  nuevoBtn.addEventListener("click", () => {
    nuevoForm.style.display = "block";
  });
}

const guardarBtn = document.getElementById("guardar-nuevo-btn");
if (guardarBtn) {
  guardarBtn.addEventListener("click", async () => {
    const titulo = document.getElementById("nuevo-titulo").value.trim();
    const autor = document.getElementById("nuevo-autor").value.trim();

    if (!titulo) {
      alert("El título es obligatorio.");
      return;
    }

    // 1. Insertar en Items
    const { data: nuevoItem, error } = await supabase
      .from("Items")
      .insert([{ titulo }])
      .select("id")
      .single();

    if (error) {
      alert("Error al crear libro: " + error.message);
      return;
    }

    // 2. Insertar en user_items del usuario actual
    await agregarLibroUsuario(nuevoItem.id);

    // Reset
    document.getElementById("nuevo-titulo").value = "";
    document.getElementById("nuevo-autor").value = "";
    nuevoForm.style.display = "none";
  });
}


// Eliminar libro
const delBtn = document.getElementById("delete-book-btn");
if (delBtn) {
  delBtn.addEventListener("click", async () => {
    const idLibro = document.getElementById("id-libro-del").value;
    if (!idLibro || !currentUser) return;

    const { error } = await supabase
      .from("user_items")
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

// ==================== AUTOCOMPLETAR ====================
const buscarInput = document.getElementById("buscar-libro");
const sugerencias = document.getElementById("sugerencias");

if (buscarInput) {
  buscarInput.addEventListener("input", async () => {
    const query = buscarInput.value.trim();
    sugerencias.innerHTML = "";

    if (query.length < 2) return;

// Buscar en Supabase (tabla Items)
    const { data: items, error } = await supabase
      .from("Items")
      .select("id, titulo")
      .ilike("titulo", `%${query}%`)
      .limit(5);

if (error) {
      console.error("Error en búsqueda:", error.message);
      return;
    }

    if (items.length === 0) {
      sugerencias.innerHTML = "<li>No se encontraron libros</li>";
      return;
    }

// Mostrar sugerencias
    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.titulo;
      li.style.cursor = "pointer";

     li.addEventListener("click", () => {
        buscarInput.value = item.titulo;
        buscarInput.dataset.id = item.id; // guardamos el ID en el input por si luego queremos usarlo
        sugerencias.innerHTML = "";
      });
      sugerencias.appendChild(li);
    });
  });
}

async function cargarCategorias() {
  const { data: categorias, error } = await supabase
    .from("Categoria")
    .select("id, tipo");

  if (error) {
    console.error("Error cargando categorías:", error.message);
    return;
  }

//===============CATEGORIAS=========================================
  const categoriaSelect = document.getElementById("categoria-select");
  const nuevaCategoriaSelect = document.getElementById("nueva-categoria");

  categorias.forEach(cat => {
    const opt1 = document.createElement("option");
    opt1.value = cat.id;
    opt1.textContent = cat.tipo;
    categoriaSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = cat.id;
    opt2.textContent = cat.tipo;
    nuevaCategoriaSelect.appendChild(opt2);
  });
}
// Llamar al cargar perfil
if (document.getElementById("categoria-select")) {
  cargarCategorias();
}

// CATEGORIA SELECCIONADA

async function agregarLibroUsuario(idItem) {
  if (!currentUser) return;

  const categoriaId = document.getElementById("categoria-select").value;

  const { error } = await supabase
    .from("user_items")
    .insert([{
      id_user: currentUser.id,
      id_item: idItem,
      id_categoria: categoriaId
    }]);

  if (error) {
    alert("Error al añadir libro: " + error.message);
  } else {
    alert("Libro añadido correctamente.");
    loadUserBooks(currentUser.id);
  }
}

//NUEVO LIBRO

if (guardarBtn) {
  guardarBtn.addEventListener("click", async () => {
    const titulo = document.getElementById("nuevo-titulo").value.trim();
    const autor = document.getElementById("nuevo-autor").value.trim();
    const categoriaId = document.getElementById("nueva-categoria").value;

    if (!titulo) {
      alert("El título es obligatorio.");
      return;
    }

    // 1. Insertar en Items
    const { data: nuevoItem, error } = await supabase
      .from("Items")
      .insert([{ titulo }])
      .select("id")
      .single();

    if (error) {
      alert("Error al crear libro: " + error.message);
      return;
    }

    // 2. Insertar en user_items con categoría seleccionada
    await agregarLibroUsuario(nuevoItem.id, categoriaId);

    // Reset
    document.getElementById("nuevo-titulo").value = "";
    document.getElementById("nuevo-autor").value = "";
    nuevoForm.style.display = "none";
  });
}


