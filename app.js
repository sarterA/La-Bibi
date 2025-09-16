// Cargar cliente de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Contenedor HTML
const contenedor = document.getElementById("libros");

// Función para cargar libros de un usuario específico
async function loadLibrosUsuario(userId) {
  // 1. Buscar los items del usuario en user_Items
  const { data: userItems, error: errorUserItems } = await supabase
    .from('user_Items')
    .select('id_item')
    .eq('id_user', userId);

  if (errorUserItems) {
    console.error("Error al traer user_Items:", errorUserItems);
    return;
  }

  if (!userItems.length) {
    contenedor.innerHTML = "<p>No hay libros registrados para este usuario.</p>";
    return;
  }

  const itemIds = userItems.map(ui => ui.id_item);

  // 2. Traer los datos de Items y sus relaciones
  const { data: items, error: errorItems } = await supabase
    .from('Items')
    .select(`
      id,
      titulo,
      volumen,
      paginas,
      Autor ( nombre ),
      Editorial ( nombre ),
      Formato ( tipo ),
      Saga ( nombre, total_libros ),
      Portadas ( url, es_principal )
    `)
    .in('id', itemIds);

  if (errorItems) {
    console.error("Error al traer Items:", errorItems);
    return;
  }

  // 3. Pintar en pantalla
  contenedor.innerHTML = "";

  items.forEach(item => {
    const portada = item.Portadas?.find(p => p.es_principal) || item.Portadas?.[0];
    const imagenUrl = portada ? portada.url : "assets/placeholder.jpg";

    const div = document.createElement("div");
    div.classList.add("libro");
    div.innerHTML = `
      <img src="${imagenUrl}" alt="${item.titulo}">
      <h3>${item.titulo}</h3>
      <p><strong>Autor:</strong> ${item.Autor?.nombre ?? "Desconocido"}</p>
      <p><strong>Editorial:</strong> ${item.Editorial?.nombre ?? "-"}</p>
      <p><strong>Formato:</strong> ${item.Formato?.tipo ?? "-"}</p>
      <p><strong>Saga:</strong> ${item.Saga?.nombre ?? "-"}</p>
    `;
    contenedor.appendChild(div);
  });
}

// ⚡ Llamar con el UUID de un usuario
document.addEventListener("DOMContentLoaded", () => {
  loadLibrosUsuario("21552d0f-80de-4566-919f-c313e33adc14"); // 👈 pon aquí el id de la tabla Users
});