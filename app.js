// Cargar cliente de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Contenedor HTML
const contenedor = document.getElementById("libros");

// Función para cargar libros de un usuario específico
async function loadLibrosUsuario(userId) {
 console.log("Cargando libros de usuario:", userId);

 const { data: userItems, error: errorUserItems } = await supabase
    .from('user_items')
    .select('id_item')
    .eq('id_user', userId);

 console.log("userItems response:", { userItems, errorUserItems });

   if (errorUserItems) {
    contenedor.innerHTML = `<p>Error al leer user_items: ${errorUserItems.message}</p>`;
    return;
  }
  if (!userItems || userItems.length === 0) {
    contenedor.innerHTML = "<p>No hay libros para este usuario.</p>";
    return;
  }

 const itemIds = userItems.map(u => u.id_item);

  // Traer los datos de Items y sus relaciones
  const { data: items, error: errorItems } = await supabase
    .from('Items')
    .select(`
      id, titulo,
      Autor ( nombre ),
      Portadas ( url, es_principal )
    `)
    .in('id', itemIds);

  console.log("items response:", { items, errorItems });

  if (errorItems) {
    contenedor.innerHTML = `<p>Error al leer items: ${errorItems.message}</p>`;
    return;
  }

  contenedor.innerHTML = "";
  items.forEach(item => {
    const portada = item.Portadas?.find(p => p.es_principal) || item.Portadas?.[0];
    const url = portada ? portada.url : "assets/placeholder.jpg";

    contenedor.insertAdjacentHTML(
      "beforeend",
      `
      <div class="libro">
        <img src="${url}" alt="${item.titulo}">
        <h3>${item.titulo}</h3>
        <p>${item.Autor?.nombre ?? "Desconocido"}</p>
      </div>
    `
    );
  });
}
// Llamar con el UUID de un usuario
document.addEventListener("DOMContentLoaded", () => {
  loadLibrosUsuario("21552d0f-80de-4566-919f-c313e33adc14"); // pon aquí el id de la tabla Users
});
