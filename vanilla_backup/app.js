// app.js – fix: defer DOM queries until content is ready, ids aligned
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON
);

// ---------------- DOM ready ----------------
window.addEventListener('DOMContentLoaded', () => {
  // Sections
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');

  // Forms
  const loginForm = loginSection.querySelector('form');
  const signupForm = signupSection.querySelector('form');

  // ---------- SPA Navigation helpers ----------
  function show(section) {
    [loginSection, signupSection].forEach(s => s.classList.add('hidden'));
    section.classList.remove('hidden');
  }

  // ---------- Login ----------
  loginForm.insertAdjacentHTML('beforeend', `
    <a id="forgot-link" href="#" class="text-sm text-cyan-400 text-center">Olvidé mi contraseña</a>
    <a id="to-signup" href="#" class="text-sm text-cyan-400 text-center">Crear cuenta</a>
  `);

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    alert('Login correcto');
  });

  // ---------- Forgot Password ----------
  document.getElementById('forgot-link').addEventListener('click', async e => {
    e.preventDefault();
    const email = prompt('Ingresa tu email para recuperar la contraseña:');
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/#password-updated`
    });
    if (error) return alert(error.message);
    alert('Te enviamos un enlace de recuperación a tu correo.');
  });

  // ---------- To Signup ----------
  document.getElementById('to-signup').addEventListener('click', e => {
    e.preventDefault();
    show(signupSection);
  });

  // ---------- Signup ----------
  signupForm.insertAdjacentHTML('beforeend', `
    <a id="to-login" href="#" class="text-sm text-cyan-400 text-center">¿Ya tienes cuenta? Iniciar sesión</a>
  `);

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role  = document.getElementById('signup-role').value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      data: { full_name: name, phone, role }
    });
    if (error) return alert(error.message);
    alert('Cuenta creada. Revisa tu email para confirmar.');
    show(loginSection);
  });

  document.getElementById('to-login').addEventListener('click', e => {
    e.preventDefault();
    show(loginSection);
  });
});
