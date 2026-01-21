// CONFIGURACIÓN GLOBAL
let pacientes = [];
let configGitHub = {
    token: localStorage.getItem('githubToken') || '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',
    user: localStorage.getItem('githubUser') || 'AppsFrees',
    repo: localStorage.getItem('githubRepo') || 'gestion-de-pacientes',
    branch: 'main',
    filePath: 'datos-pacientes.json'
};

let fileSHA = null;

let configApp = {
    name: localStorage.getItem('appName') || '🏥 Gestor de Pacientes',
    subtitle: localStorage.getItem('appSubtitle') || 'Sistema profesional de gestión dental',
    logo: localStorage.getItem('appLogo') || ''
};

let tratamientos = JSON.parse(localStorage.getItem('tratamientos')) || [
    'Ortodoncia Fija',
    'Ortodoncia Removible',
    'Profilaxis',
    'Blanqueamiento',
    'Limpieza',
    'Otro'
];

let plantillaRecordatorio = localStorage.getItem('plantillaRecordatorio') ||
    'Hola {nombre} 👋\n\nTe recordamos tu cita en nuestra clínica:\n📅 Fecha: {fecha_cita}\n🕐 Hora: {hora_cita}\n\n¡Nos vemos pronto! 😊';

let pacienteEnModal = null;

// INICIALIZAR
document.addEventListener('DOMContentLoaded', () => {
    cargarPacientes();
    actualizarEstadisticas();
    configurarEventos();
    aplicarConfigApp();
    cargarOpcionesTratamiento();
    renderTratamientos();
});

// APLICAR CONFIG APP
function aplicarConfigApp() {
    const nameEl = document.getElementById('appName');
    const subEl = document.getElementById('appSubtitle');
    const logoEl = document.getElementById('appLogo');

    if (nameEl) nameEl.textContent = configApp.name;
    if (subEl) subEl.textContent = configApp.subtitle;
    if (configApp.logo && logoEl) {
        logoEl.src = configApp.logo;
        logoEl.style.display = 'block';
    }
}

// MOSTRAR/OCULTAR CONFIG
function mostrarConfig() {
    document.getElementById('githubConfig').style.display = 'block';
    document.getElementById('githubToken').value = configGitHub.token;
    document.getElementById('githubUser').value = configGitHub.user;
    document.getElementById('githubRepo').value = configGitHub.repo;
}

function ocultarConfig() {
    document.getElementById('githubConfig').style.display = 'none';
}

function guardarConfigGitHub() {
    configGitHub.token = document.getElementById('githubToken').value;
    configGitHub.user = document.getElementById('githubUser').value;
    configGitHub.repo = document.getElementById('githubRepo').value;
    
    localStorage.setItem('githubToken', configGitHub.token);
    localStorage.setItem('githubUser', configGitHub.user);
    localStorage.setItem('githubRepo', configGitHub.repo);
    
    ocultarConfig();
    alert('✅ GitHub configurado correctamente');
}

// CONFIG APP
function mostrarConfigApp() {
    document.getElementById('appConfig').style.display = 'block';
    document.getElementById('inputAppName').value = configApp.name;
    document.getElementById('inputAppSubtitle').value = configApp.subtitle;
}

function ocultarConfigApp() {
    document.getElementById('appConfig').style.display = 'none';
}

function guardarConfigApp() {
    configApp.name = document.getElementById('inputAppName').value || configApp.name;
    configApp.subtitle = document.getElementById('inputAppSubtitle').value || configApp.subtitle;

    localStorage.setItem('appName', configApp.name);
    localStorage.setItem('appSubtitle', configApp.subtitle);

    const file = document.getElementById('inputAppLogo').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            configApp.logo = e.target.result;
            localStorage.setItem('appLogo', configApp.logo);
            aplicarConfigApp();
            alert('✅ Configuración guardada');
            ocultarConfigApp();
        };
        reader.readAsDataURL(file);
    } else {
        aplicarConfigApp();
        alert('✅ Configuración guardada');
        ocultarConfigApp();
    }
}

// CONFIG WHATSAPP
function mostrarConfigWA() {
    document.getElementById('waConfig').style.display = 'block';
    document.getElementById('textareaPlantillaWA').value = plantillaRecordatorio;
}

function ocultarConfigWA() {
    document.getElementById('waConfig').style.display = 'none';
}

function guardarConfigWA() {
    plantillaRecordatorio = document.getElementById('textareaPlantillaWA').value;
    localStorage.setItem('plantillaRecordatorio', plantillaRecordatorio);
    alert('✅ Plantilla guardada');
    ocultarConfigWA();
}

// EVENTOS
function configurarEventos() {
    document.getElementById('searchInput').addEventListener('keyup', buscarPacientes);
    document.getElementById('tipoSearch').addEventListener('change', buscarPacientes);
    document.getElementById('formPaciente').addEventListener('submit', agregarPaciente);
    document.getElementById('btnSync').addEventListener('click', sincronizarGitHub);
}

// BÚSQUEDA
function buscarPacientes() {
    const busqueda = document.getElementById('searchInput').value.toLowerCase();
    const tipo = document.getElementById('tipoSearch').value;
    const resultados = document.getElementById('resultadosBusqueda');
    
    if (!busqueda) {
        resultados.innerHTML = '';
        return;
    }
    
    let pacientesFiltrados = pacientes.filter(p => {
        if (tipo === 'codigo') return p.codigo.toLowerCase().includes(busqueda);
        if (tipo === 'nombre') return p.nombre.toLowerCase().includes(busqueda);
        if (tipo === 'apellido') return p.apellido.toLowerCase().includes(busqueda);
        return p.codigo.toLowerCase().includes(busqueda) || 
               p.nombre.toLowerCase().includes(busqueda) ||
               p.apellido.toLowerCase().includes(busqueda);
    });
    
    if (pacientesFiltrados.length === 0) {
        resultados.innerHTML = '<p class="empty-message">No encontrado</p>';
        return;
    }
    
    resultados.innerHTML = pacientesFiltrados.map(p => `
        <div class="search-result-card">
            <div>
                <strong>${p.codigo}</strong><br>
                ${p.nombre} ${p.apellido}
            </div>
            <div>
                <button onclick="mostrarPaciente('${p.codigo}')" class="btn btn-small btn-secondary">👁️</button>
                <button onclick="abrirModalCita('${p.codigo}')" class="btn btn-small btn-success">📅</button>
            </div>
        </div>
    `).join('');
}

// TRATAMIENTOS
function guardarTratamientos() {
    localStorage.setItem('tratamientos', JSON.stringify(tratamientos));
}

function cargarOpcionesTratamiento() {
    const select = document.getElementById('tratamiento');
    if (!select) return;
    select.innerHTML = tratamientos.map(t => `<option>${t}</option>`).join('');
}

function renderTratamientos() {
    const ul = document.getElementById('listaTratamientos');
    if (!ul) return;
    ul.innerHTML = tratamientos.map((t, idx) => `
        <li>
            <span>${t}</span>
            <div>
                <button class="btn btn-small" onclick="editarTratamiento(${idx})">✏️</button>
                <button class="btn btn-small btn-danger" onclick="eliminarTratamiento(${idx})">🗑️</button>
            </div>
        </li>
    `).join('');
}

function agregarTratamiento() {
    const input = document.getElementById('nuevoTratamiento');
    const valor = input.value.trim();
    if (!valor) return alert('Escribe un tratamiento');
    tratamientos.push(valor);
    guardarTratamientos();
    cargarOpcionesTratamiento();
    renderTratamientos();
    input.value = '';
}

function editarTratamiento(idx) {
    const nuevoNombre = prompt('Editar:', tratamientos[idx]);
    if (nuevoNombre && nuevoNombre.trim()) {
        tratamientos[idx] = nuevoNombre.trim();
        guardarTratamientos();
        cargarOpcionesTratamiento();
        renderTratamientos();
    }
}

function eliminarTratamiento(idx) {
    if (!confirm('¿Eliminar tratamiento?')) return;
    tratamientos.splice(idx, 1);
    guardarTratamientos();
    cargarOpcionesTratamiento();
    renderTratamientos();
}

// AGREGAR PACIENTE
function agregarPaciente(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('codigo').value;
    if (pacientes.find(p => p.codigo === codigo)) {
        alert('⚠️ Código duplicado');
        return;
    }
    
    const telefonoRaw = document.getElementById('telefono').value.trim();
    const telefonolimpio = telefonoRaw.replace(/[^\d+]/g, '');
    
    if (!telefonolimpio && telefonolimpio !== '') {
        alert('⚠️ Teléfono inválido');
        return;
    }
    
    const nuevoPaciente = {
        codigo: codigo,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        telefono: telefonolimpio,
        diagnostico: document.getElementById('diagnostico').value,
        tratamiento: document.getElementById('tratamiento').value,
        estado: document.getElementById('estado').value,
        fechaCreacion: new Date().toISOString()
    };
    
    pacientes.push(nuevoPaciente);
    guardarPacientes();
    sincronizarGitHub();
    document.getElementById('formPaciente').reset();
    cargarOpcionesTratamiento();
    actualizarLista();
    actualizarEstadisticas();
    alert('✅ Paciente agregado');

    const enviarWA = confirm('¿Enviar recordatorio por WhatsApp?');
    if (enviarWA && nuevoPaciente.telefono) {
        abrirModalCita(codigo);
    }
}

// MODAL CITA
function abrirModalCita(codigo) {
    pacienteEnModal = pacientes.find(p => p.codigo === codigo);
    if (!pacienteEnModal) return alert('Paciente no encontrado');
    if (!pacienteEnModal.telefono) return alert('Sin teléfono registrado');
    
    document.getElementById('fechaCita').value = '';
    document.getElementById('horaCita').value = '';
    document.getElementById('modalCita').style.display = 'flex';
}

function cerrarModalCita() {
    document.getElementById('modalCita').style.display = 'none';
    pacienteEnModal = null;
}

function enviarWhatsAppDesdeModal() {
    const fecha = document.getElementById('fechaCita').value;
    const hora = document.getElementById('horaCita').value;
    
    if (!fecha || !hora) {
        alert('⚠️ Completa fecha y hora');
        return;
    }
    
    if (!pacienteEnModal.telefono) {
        alert('Sin teléfono');
        return;
    }

    const fechaFormato = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES');
    
    const nombre = `${pacienteEnModal.nombre} ${pacienteEnModal.apellido}`.trim();
    let mensaje = plantillaRecordatorio
        .replace('{nombre}', nombre)
        .replace('{fecha_cita}', fechaFormato)
        .replace('{hora_cita}', hora);

    const telefonoFormato = pacienteEnModal.telefono.startsWith('+') 
        ? pacienteEnModal.telefono 
        : '+' + pacienteEnModal.telefono;

    const url = `https://wa.me/${telefonoFormato.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    cerrarModalCita();
}

// ALMACENAMIENTO
function cargarPacientes() {
    const datos = localStorage.getItem('pacientes');
    if (datos) {
        pacientes = JSON.parse(datos);
        actualizarLista();
    }
}

function guardarPacientes() {
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
}

// ACTUALIZAR LISTA
function actualizarLista() {
    const lista = document.getElementById('listaPacientes');
    if (pacientes.length === 0) {
        lista.innerHTML = '<p class="empty-message">📭 No hay pacientes registrados</p>';
        return;
    }
    
    lista.innerHTML = pacientes.map(p => `
        <div class="patient-card">
            <div class="patient-header">
                <h3>${p.codigo} - ${p.nombre} ${p.apellido}</h3>
                <span class="estado-badge estado-${p.estado.toLowerCase()}">${p.estado}</span>
            </div>
            <div class="patient-info">
                <p><strong>📧 Email:</strong> <span>${p.email || 'N/A'}</span></p>
                <p><strong>📱 Teléfono:</strong> <span>${p.telefono || 'N/A'}</span></p>
                <p><strong>🦷 Tratamiento:</strong> <span>${p.tratamiento}</span></p>
                <p><strong>📋 Diagnóstico:</strong> <span>${p.diagnostico || 'N/A'}</span></p>
            </div>
            <div class="patient-actions">
                <button onclick="editarPaciente('${p.codigo}')" class="btn btn-secondary btn-small">✏️ Editar</button>
                <button onclick="eliminarPaciente('${p.codigo}')" class="btn btn-danger btn-small">🗑️ Eliminar</button>
                <button onclick="abrirModalCita('${p.codigo}')" class="btn btn-success btn-small">📅 Cita</button>
            </div>
        </div>
    `).join('');
}

// ESTADÍSTICAS
function actualizarEstadisticas() {
    const total = pacientes.length;
    const activos = pacientes.filter(p => p.estado === 'Activo').length;
    const completados = pacientes.filter(p => p.estado === 'Completado').length;
    
    document.getElementById('totalPacientes').textContent = total;
    document.getElementById('pacientesActivos').textContent = activos;
    document.getElementById('pacientesCompletados').textContent = completados;
}

// GITHUB
async function sincronizarGitHub() {
    if (!configGitHub.token) {
        alert('⚠️ Configura GitHub primero');
        mostrarConfig();
        return;
    }
    
    const statusEl = document.getElementById('statusSync');
    const btnSync = document.getElementById('btnSync');
    
    try {
        statusEl.textContent = '⏳ Sincronizando...';
        btnSync.disabled = true;
        
        await obtenerSHA();
        
        const contenido = JSON.stringify(pacientes, null, 2);
        const datosBase64 = btoa(unescape(encodeURIComponent(contenido)));
        
        const url = `https://api.github.com/repos/${configGitHub.user}/${configGitHub.repo}/contents/${configGitHub.filePath}`;
        
        const payload = {
            message: `Actualización - ${new Date().toLocaleString('es-ES')}`,
            content: datosBase64,
            branch: configGitHub.branch
        };
        
        if (fileSHA) payload.sha = fileSHA;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${configGitHub.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const data = await response.json();
            fileSHA = data.content.sha;
            statusEl.textContent = '✅ Sincronizado';
            setTimeout(() => {
                statusEl.textContent = '';
                btnSync.disabled = false;
            }, 3000);
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        console.error(error);
        statusEl.textContent = `❌ Error`;
        btnSync.disabled = false;
    }
}

async function obtenerSHA() {
    try {
        const url = `https://api.github.com/repos/${configGitHub.user}/${configGitHub.repo}/contents/${configGitHub.filePath}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${configGitHub.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            fileSHA = data.sha;
        }
    } catch (error) {
        console.error(error);
    }
}

// EXPORTAR/IMPORTAR
function exportarJSON() {
    const dataStr = JSON.stringify(pacientes, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pacientes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importarJSON() {
    document.getElementById('fileInput').click();
}

document.getElementById('fileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                pacientes = JSON.parse(event.target.result);
                guardarPacientes();
                actualizarLista();
                actualizarEstadisticas();
                sincronizarGitHub();
                alert('✅ Datos importados');
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

// ELIMINAR
function eliminarPaciente(codigo) {
    if (confirm(`¿Eliminar ${codigo}?`)) {
        pacientes = pacientes.filter(p => p.codigo !== codigo);
        guardarPacientes();
        sincronizarGitHub();
        actualizarLista();
        actualizarEstadisticas();
        alert('✅ Eliminado');
    }
}

// EDITAR
function editarPaciente(codigo) {
    const paciente = pacientes.find(p => p.codigo === codigo);
    if (!paciente) return;

    const nuevoNombre = prompt('Nombre:', paciente.nombre);
    if (nuevoNombre === null) return;

    const nuevoApellido = prompt('Apellido:', paciente.apellido);
    if (nuevoApellido === null) return;

    const nuevoEmail = prompt('Email:', paciente.email);
    if (nuevoEmail === null) return;

    const nuevoTelefono = prompt('Teléfono:', paciente.telefono);
    if (nuevoTelefono === null) return;

    const nuevoDiagnostico = prompt('Diagnóstico:', paciente.diagnostico);
    if (nuevoDiagnostico === null) return;

    const nuevoEstado = prompt('Estado (Activo/Inactivo/Completado):', paciente.estado);
    if (nuevoEstado === null) return;

    paciente.nombre = nuevoNombre;
    paciente.apellido = nuevoApellido;
    paciente.email = nuevoEmail;
    paciente.telefono = nuevoTelefono.replace(/[^\d+]/g, '');
    paciente.diagnostico = nuevoDiagnostico;
    paciente.estado = nuevoEstado;

    guardarPacientes();
    sincronizarGitHub();
    actualizarLista();
    alert('✅ Actualizado');
}

// VER PACIENTE
function mostrarPaciente(codigo) {
    const paciente = pacientes.find(p => p.codigo === codigo);
    if (paciente) {
        alert(`👤 ${paciente.nombre} ${paciente.apellido}\n📱 ${paciente.telefono}\n🦷 ${paciente.tratamiento}\n📊 ${paciente.estado}`);
    }
}


