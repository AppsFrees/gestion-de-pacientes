// CONFIGURACIÓN Y VARIABLES GLOBALES
let pacientes = [];
let configGitHub = {
    token: localStorage.getItem('githubToken') || '',
    user: localStorage.getItem('githubUser') || 'lizardoba',
    repo: localStorage.getItem('githubRepo') || 'gestor-pacientes',
    branch: 'main',
    filePath: 'datos-pacientes.json'
};

let fileSHA = null;

// Configuración de la App (nombre, subtítulo, logo)
let configApp = {
    name: localStorage.getItem('appName') || '🏥 Gestor de Pacientes',
    subtitle: localStorage.getItem('appSubtitle') || 'Sistema profesional de gestión con sincronización GitHub',
    logo: localStorage.getItem('appLogo') || ''
};

// Tratamientos configurables
let tratamientos = JSON.parse(localStorage.getItem('tratamientos')) || [
    'Ortodoncia Fija',
    'Ortodoncia Removible',
    'Profilaxis',
    'Otro'
];

// Plantillas WhatsApp
let plantillaRecordatorio = localStorage.getItem('plantillaRecordatorio') ||
    'Hola {nombre}, te damos la bienvenida a la clínica. Tu próxima cita es el día {fecha_cita} a las {hora_cita}. Por favor confirma tu asistencia.';

let plantillaPresupuesto = localStorage.getItem('plantillaPresupuesto') ||
    'Hola {nombre}, te compartimos el presupuesto de tu tratamiento {tratamiento}: Monto: {monto}, detalles: {detalles}.';

// INICIALIZAR APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
    cargarPacientes();
    actualizarEstadisticas();
    configurarEventos();
    verificarConfigGitHub();
    aplicarConfigApp();
    cargarOpcionesTratamiento();
    renderTratamientos();
});

// CONFIGURACIÓN GITHUB
function verificarConfigGitHub() {
    if (!configGitHub.token) {
        document.getElementById('alertConfig').style.display = 'block';
    } else {
        document.getElementById('alertConfig').style.display = 'none';
    }
}

function mostrarConfig() {
    document.getElementById('githubConfig').style.display = 'block';
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
    verificarConfigGitHub();
    alert('✅ Configuración guardada correctamente');
}

// CONFIGURACIÓN APP (nombre, logo)
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

    const fileInput = document.getElementById('inputAppLogo');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            configApp.logo = e.target.result;
            localStorage.setItem('appLogo', configApp.logo);
            aplicarConfigApp();
            alert('✅ Configuración de la app guardada');
            ocultarConfigApp();
        };
        reader.readAsDataURL(file);
    } else {
        aplicarConfigApp();
        alert('✅ Configuración de la app guardada');
        ocultarConfigApp();
    }
}

// CONFIGURACIÓN PLANTILLA RECORDATORIO WHATSAPP
function mostrarConfigWA() {
    document.getElementById('waConfig').style.display = 'block';
    document.getElementById('textareaPlantillaWA').value = plantillaRecordatorio;
}

function ocultarConfigWA() {
    document.getElementById('waConfig').style.display = 'none';
}

function guardarConfigWA() {
    const nueva = document.getElementById('textareaPlantillaWA').value;
    plantillaRecordatorio = nueva;
    localStorage.setItem('plantillaRecordatorio', nueva);
    alert('✅ Plantilla de WhatsApp guardada');
    ocultarConfigWA();
}

// CONFIGURACIÓN PLANTILLA PRESUPUESTO
function mostrarConfigPresupuesto() {
    document.getElementById('presupuestoConfig').style.display = 'block';
    document.getElementById('textareaPlantillaPresupuesto').value = plantillaPresupuesto;
}

function ocultarConfigPresupuesto() {
    document.getElementById('presupuestoConfig').style.display = 'none';
}

function guardarConfigPresupuesto() {
    const nueva = document.getElementById('textareaPlantillaPresupuesto').value;
    plantillaPresupuesto = nueva;
    localStorage.setItem('plantillaPresupuesto', nueva);
    alert('✅ Plantilla de presupuesto guardada');
    ocultarConfigPresupuesto();
}

// FUNCIONES DE BÚSQUEDA Y EVENTOS
function configurarEventos() {
    document.getElementById('searchInput').addEventListener('keyup', buscarPacientes);
    document.getElementById('tipoSearch').addEventListener('change', buscarPacientes);
    document.getElementById('formPaciente').addEventListener('submit', agregarPaciente);
    document.getElementById('btnSync').addEventListener('click', sincronizarGitHub);
}

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
        resultados.innerHTML = '<p class="empty-message">No se encontraron resultados</p>';
        return;
    }
    
    resultados.innerHTML = pacientesFiltrados.map(p => `
        <div class="search-result-card">
            <strong>${p.codigo}</strong> - ${p.nombre} ${p.apellido}
            <div style="display:flex; gap:6px;">
                <button onclick="mostrarPaciente('${p.codigo}')" class="btn btn-small">Ver</button>
                <button onclick="editarPaciente('${p.codigo}')" class="btn btn-small">Editar</button>
                <button onclick="enviarPresupuestoDesdeLista('${p.codigo}')" class="btn btn-small">💰</button>
            </div>
        </div>
    `).join('');
}

// TRATAMIENTOS CONFIGURABLES
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
                <button class="btn btn-small" onclick="editarTratamiento(${idx})">Editar</button>
                <button class="btn btn-small btn-danger" onclick="eliminarTratamiento(${idx})">Eliminar</button>
            </div>
        </li>
    `).join('');
}

function agregarTratamiento() {
    const input = document.getElementById('nuevoTratamiento');
    const valor = input.value.trim();
    if (!valor) return alert('Escribe un nombre de tratamiento');
    tratamientos.push(valor);
    guardarTratamientos();
    cargarOpcionesTratamiento();
    renderTratamientos();
    input.value = '';
}

function editarTratamiento(idx) {
    const nuevoNombre = prompt('Editar tratamiento:', tratamientos[idx]);
    if (nuevoNombre && nuevoNombre.trim()) {
        tratamientos[idx] = nuevoNombre.trim();
        guardarTratamientos();
        cargarOpcionesTratamiento();
        renderTratamientos();
    }
}

function eliminarTratamiento(idx) {
    if (!confirm('¿Eliminar este tratamiento?')) return;
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
        alert('⚠️ Este código de paciente ya existe');
        return;
    }
    
    const nuevoPaciente = {
        codigo: codigo,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        diagnostico: document.getElementById('diagnostico').value,
        tratamiento: document.getElementById('tratamiento').value,
        estado: document.getElementById('estado').value,
        fechaCreacion: new Date().toISOString()
    };
    
    pacientes.push(nuevoPaciente);
    guardarPacientes();
    sincronizarGitHub();
    document.getElementById('formPaciente').reset();
    cargarOpcionesTratamiento(); // para que no se quede vacío el select
    actualizarLista();
    actualizarEstadisticas();
    alert('✅ Paciente agregado exitosamente');

    const enviarWA = confirm('¿Quieres enviar un mensaje de WhatsApp a este paciente?');
    if (enviarWA && nuevoPaciente.telefono) {
        const fecha = prompt('Fecha de la próxima cita (ej. 25/02/2026):', '');
        if (fecha === null) return;
        const hora = prompt('Hora de la próxima cita (ej. 4:00 pm):', '');
        if (hora === null) return;
        enviarWhatsAppRegistro(nuevoPaciente, { fecha, hora });
    }
}

// FUNCIONES DE ALMACENAMIENTO LOCAL
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

// ACTUALIZAR LISTA DE PACIENTES
function actualizarLista() {
    const lista = document.getElementById('listaPacientes');
    if (pacientes.length === 0) {
        lista.innerHTML = '<p class="empty-message">No hay pacientes registrados</p>';
        return;
    }
    
    lista.innerHTML = pacientes.map(p => `
        <div class="patient-card">
            <div class="patient-header">
                <h3>${p.codigo} - ${p.nombre} ${p.apellido}</h3>
                <span class="estado-badge estado-${p.estado.toLowerCase()}">${p.estado}</span>
            </div>
            <div class="patient-info">
                <p><strong>Email:</strong> ${p.email || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${p.telefono || 'N/A'}</p>
                <p><strong>Tratamiento:</strong> ${p.tratamiento}</p>
                <p><strong>Diagnóstico:</strong> ${p.diagnostico || 'N/A'}</p>
            </div>
            <div class="patient-actions">
                <button onclick="editarPaciente('${p.codigo}')" class="btn btn-secondary">✏️ Editar</button>
                <button onclick="eliminarPaciente('${p.codigo}')" class="btn btn-danger">🗑️ Eliminar</button>
                <button onclick="enviarPresupuestoDesdeLista('${p.codigo}')" class="btn btn-secondary">💰 Presupuesto</button>
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

// SINCRONIZACIÓN CON GITHUB
async function sincronizarGitHub() {
    if (!configGitHub.token) {
        alert('⚠️ Configura tu token de GitHub primero');
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
            message: `Actualización de datos - ${new Date().toLocaleString('es-ES')}`,
            content: datosBase64,
            branch: configGitHub.branch
        };
        
        if (fileSHA) {
            payload.sha = fileSHA;
        }
        
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
            throw new Error(error.message || 'Error en la sincronización');
        }
    } catch (error) {
        console.error('Error:', error);
        statusEl.textContent = `❌ Error: ${error.message}`;
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
        console.error('Error obteniendo SHA:', error);
    }
}

// EXPORTAR E IMPORTAR
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
                alert('✅ Datos importados exitosamente');
            } catch (error) {
                alert('❌ Error al importar: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

// ELIMINAR PACIENTE
function eliminarPaciente(codigo) {
    if (confirm(`¿Eliminar a ${codigo}?`)) {
        pacientes = pacientes.filter(p => p.codigo !== codigo);
        guardarPacientes();
        sincronizarGitHub();
        actualizarLista();
        actualizarEstadisticas();
        alert('✅ Paciente eliminado');
    }
}

// EDITAR PACIENTE
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

    const nuevoDiagnostico = prompt('Diagnóstico clínico:', paciente.diagnostico);
    if (nuevoDiagnostico === null) return;

    const nuevoTratamiento = prompt('Tratamiento:', paciente.tratamiento);
    if (nuevoTratamiento === null) return;

    const nuevoEstado = prompt('Estado (Activo, Inactivo, Completado):', paciente.estado);
    if (nuevoEstado === null) return;

    paciente.nombre = nuevoNombre;
    paciente.apellido = nuevoApellido;
    paciente.email = nuevoEmail;
    paciente.telefono = nuevoTelefono;
    paciente.diagnostico = nuevoDiagnostico;
    paciente.tratamiento = nuevoTratamiento;
    paciente.estado = nuevoEstado;

    guardarPacientes();
    sincronizarGitHub();
    actualizarLista();
    actualizarEstadisticas();
    alert('✅ Paciente actualizado');
}

// MOSTRAR PACIENTE
function mostrarPaciente(codigo) {
    const paciente = pacientes.find(p => p.codigo === codigo);
    if (paciente) {
        alert(`Paciente: ${paciente.nombre} ${paciente.apellido}\nEstado: ${paciente.estado}\nTratamiento: ${paciente.tratamiento}`);
    }
}

// WHATSAPP - REGISTRO Y RECORDATORIO
function enviarWhatsAppRegistro(paciente, datosCita = {}) {
    const nombre = `${paciente.nombre} ${paciente.apellido}`.trim();
    const telefono = (paciente.telefono || '').replace(/[^0-9+]/g, '');

    const fecha = datosCita.fecha || '____';
    const hora = datosCita.hora || '____';

    let mensaje = plantillaRecordatorio
        .replace('{nombre}', nombre)
        .replace('{fecha_cita}', fecha)
        .replace('{hora_cita}', hora);

    if (!telefono) {
        alert('El paciente no tiene teléfono válido.');
        return;
    }

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// WHATSAPP - PRESUPUESTO
function enviarPresupuestoDesdeLista(codigo) {
    const paciente = pacientes.find(p => p.codigo === codigo);
    if (!paciente || !paciente.telefono) {
        return alert('Este paciente no tiene teléfono registrado');
    }

    const monto = prompt('Monto del presupuesto (ej. S/ 2500):', '');
    if (monto === null) return;

    const detalles = prompt('Detalles adicionales del presupuesto:', '');
    if (detalles === null) return;

    enviarWhatsAppPresupuesto(paciente, { monto, detalles });
}

function enviarWhatsAppPresupuesto(paciente, data) {
    const nombre = `${paciente.nombre} ${paciente.apellido}`.trim();
    const telefono = (paciente.telefono || '').replace(/[^0-9+]/g, '');
    const tratamiento = paciente.tratamiento || 'odontológico';

    if (!telefono) {
        alert('El paciente no tiene teléfono válido.');
        return;
    }

    let mensaje = plantillaPresupuesto
        .replace('{nombre}', nombre)
        .replace('{tratamiento}', tratamiento)
        .replace('{monto}', data.monto || '____')
        .replace('{detalles}', data.detalles || '____');

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}
