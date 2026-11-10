/* Acceso al panel Admin. Aquí NO está la contraseña: solo su huella PBKDF2-SHA256 con sal.
   Para cambiarla, genera una huella nueva con la misma sal e iteraciones (o pídele a Claude que lo haga). */
window.OG_ADMIN = { user: 'admin', salt: '2cae3db9d925a06fd92b75d316cfeac9', iter: 150000, hash: 'ae403789a9cf9ff90a9c369b2fb957f4f1dd348d21db6396f0b828b6c8059484' };
