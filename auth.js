// Configuración de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Helpers ----
function debounce(fn, delay=300){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(()=> fn(...args), delay);
  }
}

// Variables DOM
const buscarInput = document.getElementById("buscar-libro");
const sugerencias = document.getElementById("sugerencias");
const btnAddSelected = document.getElementById("btn-add-selected");
const btnShowNew = document.getElementById("btn-show-new");
const categoriaSelect = document.getElementById("categoria-select");
const nuevaCategoriaSelect = document.getElementById("nueva-categoria");
const precioInput = document.getElementById("precio-input");
const formNuevo = document.getElementById("form-nuevo");
const guardarNuevoBtn = document.getElementById("guardar-nuevo-btn");
const cancelarNuevoBtn = document.getElementById("cancelar-nuevo-btn");

let currentUser = null;
let selectedItemId = null;

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

//===============CATEGORIAS=========================================

async function cargarCategorias(){
  const { data: categorias, error } = await supabase
    .from('Categoria')   // usa el nombre exacto de tu tabla
    .select('id, tipo');

  if (error) {
    console.error('Error cargando categorías:', error);
    return;
  }

  categoriaSelect.innerHTML = '<option value="">-- Seleccione --</option>';
  nuevaCategoriaSelect.innerHTML = '<option value="">-- Seleccione --</option>';

categorias.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.tipo;
    categoriaSelect.appendChild(o);

    const o2 = o.cloneNode(true);
    nuevaCategoriaSelect.appendChild(o2);
  });
}


// Llamar al cargar perfil
if (document.body.contains(buscarInput)) {
  cargarCategorias();
}

// ---- Búsqueda / Autocomplete (Parte 1 y 2) ----
const buscarYMostrar = debounce(async () => {
  const q = buscarInput.value.trim();
  selectedItemId = null;
  buscarInput.removeAttribute('data-id');
  btnAddSelected.disabled = true;
  sugerencias.innerHTML = '';

  if (q.length < 2) {
    btnShowNew.style.display = 'none';
    return;
  }

const { data: items, error } = await supabase
    .from('Items')   // respeta mayúsculas si tu tabla las tiene
    .select('id, titulo')
    .ilike('titulo', `%${q}%`)
    .limit(8);

if (error) {
    console.error('Error búsqueda Items:', error);
    return;
  }

if (!items || items.length === 0) {
    // no coincidencias -> mostrar botón para crear nuevo
    sugerencias.innerHTML = '<li>No se encontraron libros</li>';
    btnShowNew.style.display = 'inline-block';
    return;
  }

// hay coincidencias -> ocultar crear nuevo
  btnShowNew.style.display = 'none';

 // crear la lista de sugerencias (clic SOLO rellena el input)
  items.forEach(it => {
    const li = document.createElement('li');
    li.textContent = it.titulo;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      buscarInput.value = it.titulo;
      buscarInput.dataset.id = it.id;
      selectedItemId = it.id;
      sugerencias.innerHTML = '';
      btnAddSelected.disabled = false;
    });
    sugerencias.appendChild(li);
  });
}, 250);

// enlazar input
if (buscarInput) buscarInput.addEventListener('input', buscarYMostrar);

// PREVENIR que Enter haga submit si esto está dentro de un form
if (buscarInput) {
  buscarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });
}


// ---- Añadir libro seleccionado (botón explícito) ----
btnAddSelected.addEventListener('click', async () => {
  if (!currentUser) return alert('No autenticado.');
  const idItem = selectedItemId || buscarInput.dataset.id;
  if (!idItem) return alert('Seleccione primero un libro de las sugerencias.');

  const categoriaId = categoriaSelect.value;
  if (!categoriaId) return alert('Seleccione una categoría.');

  const precio = precioInput.value ? Number(precioInput.value) : null;

  // Insert en user_items con categoría y precio (si tu tabla tiene campo precio)
  const { error } = await supabase
    .from('user_items')
    .insert([{
      id_user: currentUser.id,
      id_item: idItem,
      id_categoria: categoriaId,
      Precio: precio // si tu columna existe; si no, quítalo
    }]);

  if (error) {
    console.error('Error al añadir libro:', error);
    alert('Error al añadir libro: ' + error.message);
    return;
  }

  // éxito: recargar lista de usuario
  alert('Libro añadido correctamente.');
  buscarInput.value = '';
  buscarInput.removeAttribute('data-id');
  selectedItemId = null;
  btnAddSelected.disabled = true;
  precioInput.value = '';
  await loadUserBooks(currentUser.id); // asumiendo que esa función existe
});

// ---- Mostrar form para nuevo libro (cuando no hay coincidencias) ----

btnShowNew.addEventListener('click', () => {
  formNuevo.style.display = 'block';
  // preseleccionar categoría en el form según la que esté elegida arriba (si quieres)
  nuevaCategoriaSelect.value = categoriaSelect.value || '';
});


// ---- Guardar nuevo libro y añadirlo al user_items ----

guardarNuevoBtn.addEventListener('click', async () => {
  if (!currentUser) return alert('No autenticado.');
  const titulo = document.getElementById('nuevo-titulo').value.trim();
  const autor = document.getElementById('nuevo-autor').value.trim();
  const categoriaId = nuevaCategoriaSelect.value;
  const precioNuevo = document.getElementById('nuevo-precio').value ? Number(document.getElementById('nuevo-precio').value) : null;

  if (!titulo) return alert('El título es obligatorio.');
  if (!categoriaId) return alert('Seleccione una categoría.');

  // 1) Insert en Items
  const { data: inserted, error: errInsert } = await supabase
    .from('Items')
    .insert([{ titulo, id_autor: null }]) // completa los campos que necesites
    .select('id')
    .single();

  if (errInsert) {
    console.error('Error creando Item:', errInsert);
    return alert('Error creando Item: ' + errInsert.message);
  }

  const nuevoId = inserted.id;

  // 2) Insert en user_items con la categoría y precio
  const { error: errUserItem } = await supabase
    .from('user_items')
    .insert([{
      id_user: currentUser.id,
      id_item: nuevoId,
      id_categoria: categoriaId,
      Precio: precioNuevo
    }]);

  if (errUserItem) {
    console.error('Error al añadir nuevo user_item:', errUserItem);
    return alert('Error al añadir libro al usuario: ' + errUserItem.message);
  }

  // éxito
  alert('Nuevo libro creado y añadido a tu biblioteca.');
  formNuevo.style.display = 'none';
  document.getElementById('nuevo-titulo').value = '';
  document.getElementById('nuevo-autor').value = '';
  document.getElementById('nuevo-precio').value = '';
  await loadUserBooks(currentUser.id);
});

// Cancelar nuevo libro
cancelarNuevoBtn.addEventListener('click', () => {
  formNuevo.style.display = 'none';
});

