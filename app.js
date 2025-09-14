// Datos de prueba (luego vendrán de Supabase)
const libros = [
  { titulo: "El Quijote", imagen: "assets/ejemplo.jpg" },
  { titulo: "Cien años de soledad", imagen: "assets/ejemplo.jpg" },
  { titulo: "La sombra del viento", imagen: "assets/ejemplo.jpg" }
];

// Insertar libros en la página
const contenedor = document.getElementById("libros");

libros.forEach(libro => {
  const div = document.createElement("div");
  div.classList.add("libro");
  div.innerHTML = `
    <img src="${libro.imagen}" alt="${libro.titulo}">
    <h3>${libro.titulo}</h3>
  `;
  contenedor.appendChild(div);
});

