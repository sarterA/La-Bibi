// Configuración de Supabase
const SUPABASE_URL = "https://buuaufbcuxammcotgiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dWF1ZmJjdXhhbW1jb3RnaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzQ3OTksImV4cCI6MjA2NjYxMDc5OX0.BXp3WodQ0fBEWTfG6Jv0OjJcgRJFib9OkoL55rrBdA8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// LOGIN
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
      // Guardar sesión y redirigir al perfil
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "perfil.html";
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });
}

// CARGAR USUARIO EN PERFIL
if (window.location.pathname.includes("perfil.html")) {
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    console.log("Usuario autenticado:", user);
    // Aquí puedes cargar los libros de este usuario en #mis-libros
  })();
}
