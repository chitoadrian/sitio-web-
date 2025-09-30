// Utilidades simples
function select(selector, scope) {
  return (scope || document).querySelector(selector);
}
function selectAll(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

// Año dinámico en footer
const yearEl = select('#year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Menú móvil
const navToggle = select('.nav-toggle');
const siteNav = select('.site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Ripple effect on buttons
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const btn = target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// -------------------------
// Servicios: catálogo interactivo con búsqueda y orden
const SERVICES = [
  { id: 'svc-build', name: 'Armado de PC a medida', description: 'PC a medida según presupuesto y uso.', price: 79.99, img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=60' },
  { id: 'svc-maint', name: 'Mantenimiento y limpieza', description: 'Optimización, cambio de pasta térmica y limpieza.', price: 39.99, img: 'assets/img/maintenance.svg' },
  { id: 'svc-remote', name: 'Soporte remoto', description: 'Diagnóstico y solución de problemas a distancia.', price: 24.99, img: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&auto=format&fit=crop&q=60' },
  { id: 'svc-os', name: 'Instalación de sistema operativo', description: 'Instalación y activación de Windows/Linux.', price: 29.99, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=60' },
  { id: 'svc-backup', name: 'Respaldo y migración de datos', description: 'Copia de seguridad y traslado a nuevos equipos.', price: 34.99, img: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=1200&auto=format&fit=crop&q=60' }
];

function formatPrice(n) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n); }

function renderServices(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = items.map((s) => `
    <article class="card">
      ${s.img ? `<img src="${s.img}" alt="${s.name}">` : ''}
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <div style="display:flex; justify-content: space-between; align-items:center; gap:.5rem; margin-top:.5rem;">
        <strong>${formatPrice(s.price)}</strong>
        <button class="btn" data-add-service="${s.id}">Añadir</button>
      </div>
    </article>
  `).join('');
}

function sortServices(items, mode) {
  const arr = [...items];
  switch (mode) {
    case 'precio-asc':
      return arr.sort((a,b) => a.price - b.price);
    case 'precio-desc':
      return arr.sort((a,b) => b.price - a.price);
    case 'nombre':
      return arr.sort((a,b) => a.name.localeCompare(b.name, 'es'));
    default:
      return items; // relevancia (orden original)
  }
}

function setupServicePage() {
  const listEl = select('#services-list');
  if (!listEl) return;
  const input = select('#service-search');
  const sortSel = select('#service-sort');
  let filtered = [...SERVICES];

  function apply() {
    const q = (input?.value || '').toLowerCase();
    const sorted = sortServices(
      SERVICES.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
      sortSel?.value
    );
    filtered = sorted;
    renderServices(listEl, filtered);
  }

  input?.addEventListener('input', apply);
  sortSel?.addEventListener('change', apply);
  apply();

  // Hook carrito: añadir servicio
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const addBtn = t.closest('[data-add-service]');
    if (!addBtn) return;
    const id = addBtn.getAttribute('data-add-service');
    const item = SERVICES.find(s => s.id === id);
    if (item) {
      cartAdd({ id: item.id, name: item.name, price: item.price, qty: 1, type: 'service', img: item.img });
      updateCartBadge();
    }
  });
}

// -------------------------
// Carrito básico (utilizado por servicios). Si no hay UI, no falla.
const CART_KEY = 'ts_cart';
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(_) { return []; }
}
function setCart(items) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch(_) {} }
function cartAdd(newItem) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === newItem.id);
  if (idx >= 0) { cart[idx].qty += newItem.qty || 1; } else { cart.push({ ...newItem }); }
  setCart(cart);
}
function cartCount() { return getCart().reduce((sum, i) => sum + (i.qty || 1), 0); }
function updateCartBadge() {
  const badge = select('[data-cart-count]');
  if (!badge) return; // No UI presente
  badge.textContent = String(cartCount());
}

// Inicializar página de servicios si corresponde
document.addEventListener('DOMContentLoaded', () => {
  setupServicePage();
  setupCartPage();
});

// Render de carrito en carrito.html
function setupCartPage() {
  const listRoot = select('#cart-list');
  if (!listRoot) return;
  const emptyEl = select('#cart-empty');
  const totalEl = select('#cart-total');
  const summary = select('#cart-summary');
  const statusEl = select('#cart-status');

  function render() {
    const items = getCart();
    if (!items.length) {
      if (emptyEl) emptyEl.style.display = '';
      if (summary) summary.style.display = 'none';
      listRoot.innerHTML = '';
      updateCartBadge();
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (summary) summary.style.display = 'flex';

    listRoot.innerHTML = items.map((it, idx) => `
      <div class="cart-item">
        ${it.img ? `<img src="${it.img}" alt="${it.name}">` : `<div style=\"width:72px;height:48px;background:#0a0f1a;border-radius:8px\"></div>`}
        <div>
          <div style="font-weight:600;">${it.name}</div>
          <div style="color:var(--muted); font-size:.9rem;">${it.type === 'service' ? 'Servicio' : 'Producto'}</div>
        </div>
        <div><strong>${formatPrice(it.price)}</strong></div>
        <div>
          <input class="qty-input" type="number" min="1" value="${it.qty || 1}" data-qty-idx="${idx}">
        </div>
        <div>
          <button class="btn" data-remove-idx="${idx}">Eliminar</button>
        </div>
      </div>
    `).join('');

    const total = items.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
    if (totalEl) totalEl.textContent = formatPrice(total);
    updateCartBadge();
  }

  listRoot.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const idxStr = t.getAttribute('data-qty-idx');
    if (!idxStr) return;
    const idx = Number(idxStr);
    const cart = getCart();
    const val = Math.max(1, Number(t.value) || 1);
    cart[idx].qty = val;
    setCart(cart);
    render();
  });

  listRoot.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const idxStr = t.getAttribute('data-remove-idx');
    if (!idxStr) return;
    const idx = Number(idxStr);
    const cart = getCart();
    cart.splice(idx, 1);
    setCart(cart);
    if (statusEl) statusEl.textContent = 'Artículo eliminado';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1200);
    render();
  });

  const checkoutBtn = select('#checkout-btn');
  checkoutBtn?.addEventListener('click', () => {
    setCart([]);
    if (statusEl) statusEl.textContent = 'Compra realizada. ¡Gracias!';
    render();
  });

  render();
}

// -------------------------
// Autenticación básica (client-side)
// NO usar en producción. Sólo demostración.
const AUTH_KEY = 'ts_auth_user';

function isLogged() {
  try {
    return Boolean(localStorage.getItem(AUTH_KEY));
  } catch (_) { return false; }
}

function login(username) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify({ username })); } catch (_) {}
}

function logout() {
  try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
}

function currentUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

const PROFILE_KEY = 'ts_profile';
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}
function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (_) {}
}

// Nav dinámica: mostrar Ingresar/Perfil según sesión
function updateNav() {
  const ul = siteNav ? siteNav.querySelector('ul') : null;
  if (!ul) return;
  const existingAuthLinks = selectAll('[data-auth-link]', ul);
  existingAuthLinks.forEach((el) => el.remove());

  // Inserta/actualiza enlace de carrito con badge
  let cartLi = select('[data-cart-link]', ul);
  if (!cartLi) {
    cartLi = document.createElement('li');
    cartLi.setAttribute('data-cart-link', '');
    const aCart = document.createElement('a');
    aCart.href = 'carrito.html';
    aCart.innerHTML = 'Carrito <span class="cart-badge" data-cart-count>0</span>';
    cartLi.appendChild(aCart);
    ul.appendChild(cartLi);
  }

  if (isLogged()) {
    const liPerfil = document.createElement('li');
    liPerfil.setAttribute('data-auth-link', '');
    const aPerfil = document.createElement('a');
    aPerfil.href = 'perfil.html';
    aPerfil.textContent = 'Perfil';
    liPerfil.appendChild(aPerfil);

    const liLogout = document.createElement('li');
    liLogout.setAttribute('data-auth-link', '');
    const aLogout = document.createElement('a');
    aLogout.href = '#';
    aLogout.textContent = 'Cerrar sesión';
    aLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      updateNav();
      window.location.href = 'index.html';
    });
    liLogout.appendChild(aLogout);

    ul.appendChild(liPerfil);
    ul.appendChild(liLogout);
  } else {
    const liLogin = document.createElement('li');
    liLogin.setAttribute('data-auth-link', '');
    const aLogin = document.createElement('a');
    aLogin.href = 'login.html';
    aLogin.textContent = 'Ingresar';
    liLogin.appendChild(aLogin);
    ul.appendChild(liLogin);
  }
}

updateNav();
updateCartBadge();

// Lógica del formulario de login (admin/admin)
const loginForm = select('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = select('#login-username').value.trim();
    const password = select('#login-password').value.trim();
    const statusEl = select('#login-status');
    selectAll('.error').forEach((el) => (el.textContent = ''));

    if (!username) {
      const err = select('.error[data-for="login-username"]');
      if (err) err.textContent = 'Ingresa el usuario';
      return;
    }
    if (!password) {
      const err = select('.error[data-for="login-password"]');
      if (err) err.textContent = 'Ingresa la contraseña';
      return;
    }

    if (username === 'admin' && password === 'admin') {
      login(username);
      statusEl.textContent = 'Ingreso exitoso. Redirigiendo...';
      updateNav();
      setTimeout(() => { window.location.href = 'perfil.html'; }, 600);
    } else {
      statusEl.textContent = 'Credenciales inválidas';
    }
  });
}

// Guard para perfil.html
if (window.location.pathname.endsWith('perfil.html')) {
  if (!isLogged()) {
    window.location.href = 'login.html';
  } else {
    const user = currentUser();
    const name = user?.username || 'usuario';
    const u1 = select('#profile-username');
    const u2 = select('#profile-username-2');
    if (u1) u1.textContent = name;
    if (u2) u2.textContent = name;
    const logoutBtn = select('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
        updateNav();
        window.location.href = 'index.html';
      });
    }

    // Cargar y persistir datos del perfil
    const form = select('#profile-form');
    const statusEl = select('#profile-status');
    if (form) {
      // Inicializar con lo guardado
      const profile = loadProfile();
      const fields = {
        name: select('#pf-name'),
        email: select('#pf-email'),
        phone: select('#pf-phone'),
        address: select('#pf-address')
      };
      fields.name.value = profile.name || '';
      fields.email.value = profile.email || '';
      fields.phone.value = profile.phone || '';
      fields.address.value = profile.address || '';

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProfile = {
          name: fields.name.value.trim(),
          email: fields.email.value.trim(),
          phone: fields.phone.value.trim(),
          address: fields.address.value.trim()
        };
        saveProfile(newProfile);
        if (statusEl) statusEl.textContent = 'Datos guardados';
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 1400);
      });
    }
  }
}
// Validación del formulario de contacto
const form = select('#contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = select('#name');
    const emailInput = select('#email');
    const messageInput = select('#message');
    const statusEl = select('#form-status');

    const errors = {};

    if (!nameInput.value.trim()) {
      errors.name = 'Ingresa tu nombre.';
    }
    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      errors.email = 'Ingresa tu correo.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.email = 'Correo no válido.';
    }
    if (!messageInput.value.trim()) {
      errors.message = 'Escribe un mensaje.';
    }

    // Mostrar errores
    selectAll('.error').forEach((el) => (el.textContent = ''));
    Object.entries(errors).forEach(([key, value]) => {
      const errEl = select(`.error[data-for="${key}"]`);
      if (errEl) errEl.textContent = value;
    });

    if (Object.keys(errors).length > 0) {
      statusEl.textContent = '';
      return;
    }

    // Simular envío exitoso
    statusEl.textContent = 'Mensaje enviado. ¡Gracias por contactarnos!';
    form.reset();
  });
}

