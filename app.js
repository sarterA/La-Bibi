// Cargar cliente de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referencia al contenedor de libros
const contenedor = document.getElementById("libros");

//Usuario
loadLibrosUsuario("21552d0f-80de-4566-919f-c313e33adc14");

// Función para cargar los libros de un usuario específico
async function loadLibrosUsuario {
  const { data: userItems, error } = await supabase
    .from('user_items')
    .select(`
      id,
      id_user,
      id_item,
      Items (
        id,
        titulo,
        volumen,
        paginas,
        Autor ( nombre ),
        Editorial ( nombre ),
        Formato ( tipo ),
        Saga ( nombre, total_libros ),
        Portadas ( url, es_principal )
      )
    `)
    .eq('id_user', loadLibrosUsuario); // 👈 Filtrar por usuario

  if (error) {
    console.error("Error al cargar libros:", error);
    return;
  }

  // Limpiar contenedor
  const contenedor = document.getElementById("libros");
  contenedor.innerHTML = "";

  // Insertar cada libro
  userItems.forEach(userItem => {
    const item = userItem.Items;

    // Buscar portada principal
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


