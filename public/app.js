//ELEMENTOS DEL DOM 
const imagenInput = document.getElementById('imagenInput');
const mensajeInput = document.getElementById('mensajeInput');
const claveInput = document.getElementById('claveInput');

const btnComoFunciona = document.getElementById('btnComoFunciona');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const btnCerrarModalX = document.getElementById('btnCerrarModalX');
const btnCerrarModal = document.getElementById('btnCerrarModal');

const dropZone = document.getElementById('dropZone');

const previewContenedor = document.getElementById('previewContenedor');
const imagenPreview = document.getElementById('imagenPreview');

const btnOcultar = document.getElementById('btnOcultar');
const btnRevelar = document.getElementById('btnRevelar');

const progresoContenedor = document.getElementById('progresoContenedor');
const progresoBarra = document.getElementById('progresoBarra');
const progresoTexto = document.getElementById('progresoTexto');

const seguridadContenedor = document.getElementById('seguridadContenedor');
const barraSeguridad = document.getElementById('barraSeguridad');
const textoSeguridad = document.getElementById('textoSeguridad');

const resultadoBox = document.getElementById('resultadoBox');
const textoRecuperado = document.getElementById('textoRecuperado');

const errorImagen = document.getElementById('errorImagen');
const errorMensaje = document.getElementById('errorMensaje');
const errorClave = document.getElementById('errorClave');

const tituloResultado = document.getElementById('tituloResultado');
const btnDescargar = document.getElementById('btnDescargar');

const iconoOcultar = document.getElementById('iconoOcultar');
const iconoRevelar = document.getElementById('iconoRevelar');

const arcoOcultar = document.getElementById('arcoOcultar');
const arcoRevelar = document.getElementById('arcoRevelar');

const contadorPalabras = document.getElementById('contadorPalabras');
const barraCapacidadContenedor = document.getElementById('barraCapacidadContenedor');
const barraCapacidad = document.getElementById('barraCapacidad');
const errorCapacidad = document.getElementById('errorCapacidad');

let capacidadMaximaBytes = 0;
let capacidadMaximaPalabras = 0;

function calcularCapacidadImagen(archivo) {
    if (!archivo) {
        capacidadMaximaBytes = 0;
        capacidadMaximaPalabras = 0;
        contadorPalabras.classList.add('hidden');
        barraCapacidadContenedor.classList.add('hidden');
        return;
    }

    // Usar la imagen de vista previa que ya cargamos para sacar el alto y ancho seguros
    // Esto asegura que funcione incluso si arrastran un JPG o WebP
    if (imagenPreview.complete && imagenPreview.naturalWidth > 0) {
        ejecutarCalculo();
    } else {
        imagenPreview.onload = ejecutarCalculo;
    }

    function ejecutarCalculo() {
        const width = imagenPreview.naturalWidth;
        const height = imagenPreview.naturalHeight;
        let canales = 3; // Por defecto asumimos RGB

        // Intentamos leer la cabecera si es PNG para ver si tiene Transparencia (RGBA)
        if (archivo.type === "image/png" || archivo.name.toLowerCase().endsWith(".png")) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const view = new DataView(e.target.result);
                    if (view.getUint32(0) === 0x89504E47) {
                        const colorType = view.getUint8(25);
                        if (colorType === 6) canales = 4; // RGBA
                        if (colorType === 0) canales = 1;
                        if (colorType === 4) canales = 2;
                    }
                } catch (err) {
                    console.error("No se pudo leer canales extra, asumiendo 3.");
                }
                finalizarCalculo(width, height, canales);
            };
            reader.readAsArrayBuffer(archivo.slice(0, 30));
        } else {
            // Si no es PNG, usamos 3 canales (RGB)
            finalizarCalculo(width, height, canales);
        }
    }

    function finalizarCalculo(w, h, c) {
        const totalBits = w * h * c;
        capacidadMaximaBytes = Math.max(0, Math.floor(totalBits / 8) - 4);
        capacidadMaximaPalabras = Math.floor(capacidadMaximaBytes / 6);

        contadorPalabras.classList.remove('hidden');
        barraCapacidadContenedor.classList.remove('hidden');
        actualizarContadorPalabras();
    }
}

function actualizarContadorPalabras() {
    if (capacidadMaximaBytes === 0) return;

    const texto = mensajeInput.value;
    const bytesTexto = new TextEncoder().encode(texto).length;

    const porcentaje = Math.min(100, (bytesTexto / capacidadMaximaBytes) * 100);
    const porcentajeTexto = porcentaje.toFixed(porcentaje > 0 && porcentaje < 1 ? 1 : 0);

    const caracteresFormateados = bytesTexto.toLocaleString('es-ES');
    const maxFormateado = capacidadMaximaBytes.toLocaleString('es-ES');

    contadorPalabras.innerText = `${caracteresFormateados} / ${maxFormateado} caracteres (${porcentajeTexto}%)`;
    barraCapacidad.style.width = `${Math.min(100, porcentaje)}%`;

    if (bytesTexto > capacidadMaximaBytes) {
        barraCapacidad.className = 'h-full bg-red-500 transition-all duration-200';
        contadorPalabras.classList.add('text-red-400');
        contadorPalabras.classList.remove('text-gray-400', 'text-yellow-400', 'text-emerald-400');
        errorCapacidad.classList.remove('hidden');
    } else if (porcentaje >= 80) {
        barraCapacidad.className = 'h-full bg-yellow-500 transition-all duration-200';
        contadorPalabras.classList.add('text-yellow-400');
        contadorPalabras.classList.remove('text-gray-400', 'text-red-400', 'text-emerald-400');
        errorCapacidad.classList.add('hidden');
    } else {
        barraCapacidad.className = 'h-full bg-emerald-500 transition-all duration-200';
        contadorPalabras.classList.add('text-emerald-400');
        contadorPalabras.classList.remove('text-gray-400', 'text-red-400', 'text-yellow-400');
        errorCapacidad.classList.add('hidden');
    }
}

mensajeInput.addEventListener('input', actualizarContadorPalabras);

imagenInput.addEventListener('change', (event) => {
    // se agrega la primer foto que subio el usuario
    const archivo = event.target.files[0];
    
    if (archivo) {
        //se le asigna una URL para mostrarla en pantalla
        const urlFoto = URL.createObjectURL(archivo);
        imagenPreview.src = urlFoto;
        
        previewContenedor.classList.remove('hidden');
        errorImagen.classList.add('hidden');
        calcularCapacidadImagen(archivo);
    } else {
        previewContenedor.classList.add('hidden');
        imagenPreview.src = "";
        calcularCapacidadImagen(null);
    }
}); 

function limpiarErroresInline() {
    errorImagen.classList.add('hidden');
    errorMensaje.classList.add('hidden');
    errorClave.classList.add('hidden');
    errorCapacidad.classList.add('hidden');
}
function mostrarErrorInline(elementoHTML) {
    elementoHTML.classList.remove('hidden');
}
function mostrarErrorGlobal(mensaje) {
    errorTexto.innerText = mensaje;
    errorBox.classList.remove('hidden'); 
    setTimeout(() => {
        errorBox.classList.add('hidden');
    }, 4000);
}

// Arrastrar y Soltar
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evento => {
    dropZone.addEventListener(evento, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(evento => {
    dropZone.addEventListener(evento, () => {
        dropZone.classList.add('border-emerald-500', 'bg-gray-800');
        dropZone.classList.remove('border-gray-600', 'bg-gray-900/50');
    }, false);
});


['dragleave', 'drop'].forEach(evento => {
    dropZone.addEventListener(evento, () => {
        dropZone.classList.remove('border-emerald-500', 'bg-gray-800');
        dropZone.classList.add('border-gray-600', 'bg-gray-900/50');
    }, false);
});


dropZone.addEventListener('drop', (e) => {
    const archivosSoltados = e.dataTransfer.files;
    
    if (archivosSoltados.length > 0) {
       
        imagenInput.files = archivosSoltados;
        
        const eventoChange = new Event('change');
        imagenInput.dispatchEvent(eventoChange);
    }
}, false);
// DIFICULTAD DE CONTRASEÑA
claveInput.addEventListener('input', (evento) => {
    const pass = evento.target.value;
    
    // Si borró todo, se oculta la barra
    if (pass.length === 0) {
        seguridadContenedor.classList.add('hidden');
        return;
    }
    
    seguridadContenedor.classList.remove('hidden');
    
    // Calculamos el puntaje (de 0 a 5)
    let puntaje = 0;
    if (pass.length >= 4) puntaje++; // No es larga
    if (pass.length >= 8) puntaje++; // Es larga
    if (/[A-Z]/.test(pass)) puntaje++; // mayúsculas
    if (/[0-9]/.test(pass)) puntaje++; // números
    if (/[^A-Za-z0-9]/.test(pass)) puntaje++; // símbolos 

    barraSeguridad.className = 'h-full transition-all duration-300 ease-out ';
    textoSeguridad.className = 'text-xs font-bold ml-3 tracking-wide ';


    if (puntaje <= 2) {
        barraSeguridad.classList.add('w-1/3', 'bg-red-500');
        textoSeguridad.innerText = 'DÉBIL';
        textoSeguridad.classList.add('text-red-500');
    } else if (puntaje === 3 || puntaje === 4) {
        barraSeguridad.classList.add('w-2/3', 'bg-yellow-500');
        textoSeguridad.innerText = 'MEDIA';
        textoSeguridad.classList.add('text-yellow-500');
    } else {
        barraSeguridad.classList.add('w-full', 'bg-emerald-500');
        textoSeguridad.innerText = 'FUERTE';
        textoSeguridad.classList.add('text-emerald-500');
    }
});

// OCULTAR
btnOcultar.addEventListener('click', () => {
    limpiarErroresInline(); 
    let hayError = false; 

    if (imagenInput.files.length === 0) {
        mostrarErrorInline(errorImagen);
        hayError = true;
    }

    const mensaje = mensajeInput.value;
    const clave = claveInput.value;

    if (mensaje === "") {
        mostrarErrorInline(errorMensaje);
        hayError = true;
    }
    if (clave === "") {
        mostrarErrorInline(errorClave); 
        hayError = true;
    }   

    const bytesTexto = new TextEncoder().encode(mensaje).length;
    if (capacidadMaximaBytes > 0 && bytesTexto > capacidadMaximaBytes) {
        mostrarErrorInline(errorCapacidad);
        hayError = true;
    }
    
    if (hayError) return;

   const foto = imagenInput.files[0];

  
    btnOcultar.disabled = true; 
    progresoContenedor.classList.remove('hidden');
    progresoBarra.style.width = '0%';
    progresoTexto.innerText = '0%';


    let progreso = 0;
    const intervaloProgreso = setInterval(() => {
        progreso += Math.floor(Math.random() * 15) + 5; 
        if (progreso > 90) progreso = 90;
        
        progresoBarra.style.width = progreso + '%';
        progresoTexto.innerText = progreso + '%';
    }, 100);

    fetch('/ocultar', {
        method: 'POST',
        headers: {
            'X-Mensaje': encodeURIComponent(mensaje), 
            'X-Clave': encodeURIComponent(clave)
        },
        body: foto 
    })
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("El servidor falló");
        
        return respuesta.blob(); 
    })
    .then(imagenModificada => {
        clearInterval(intervaloProgreso);
        progresoBarra.style.width = '100%';
        progresoTexto.innerText = '100%';

        setTimeout(() => {
            const urlTemporal = window.URL.createObjectURL(imagenModificada);
            arcoOcultar.classList.add('forzar-cierre');
            btnDescargar.href = urlTemporal;
            btnDescargar.download = "punto_ciego.png";
        
            tituloResultado.innerText = "¡Mensaje oculto y encriptado con éxito!";
            tituloResultado.classList.replace('text-indigo-400', 'text-emerald-400');
        
            textoRecuperado.classList.add('hidden'); 
            btnDescargar.classList.remove('hidden');
        
            resultadoBox.classList.remove('hidden');
            progresoContenedor.classList.add('hidden');
            btnOcultar.disabled = false;
        }, 500);
    })
    .catch(error => {
        clearInterval(intervaloProgreso);
        progresoContenedor.classList.add('hidden');
        btnOcultar.disabled = false;

        mostrarErrorGlobal("No se pudo conectar con el servidor");
        console.error(error);
    });
});

//REVELAR
btnRevelar.addEventListener('click', () => {
    
    limpiarErroresInline(); 
    let hayError = false; 

   
    if (imagenInput.files.length === 0) {
        mostrarErrorInline(errorImagen);
        hayError = true;
    }

    const clave = claveInput.value;
    if (clave === "") {
        mostrarErrorInline(errorClave);
        hayError = true;
    }

    if (hayError) return;

    const foto = imagenInput.files[0];

    fetch('/revelar', {
        method: 'POST',
        headers: {
            'X-Clave': encodeURIComponent(clave)
        },
        body: foto
    })
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error: Clave incorrecta o foto sin mensaje.");
        return respuesta.text();
    })
    .then(mensajeDescubierto => {
      
    arcoRevelar.classList.add('forzar-apertura');

       
        tituloResultado.innerText = "¡Mensaje recuperado con éxito!";
        tituloResultado.classList.replace('text-emerald-400', 'text-indigo-400');   
        
        
        textoRecuperado.innerText = decodeURIComponent(mensajeDescubierto); 
        
        
        btnDescargar.classList.add('hidden');
        textoRecuperado.classList.remove('hidden'); 
        resultadoBox.classList.remove('hidden');
    })  
    .catch(error => {
        mostrarErrorGlobal("Error al revelar, Verifique que la clave y la foto sean las correctas");
        console.error(error);
    });
});

function abrirModal() {
    modalBackdrop.classList.remove('opacity-0', 'pointer-events-none');

    modalCard.classList.remove('scale-95');
}

function cerrarModal() {
    // Volvemos a hacer todo invisible e intocable
    modalBackdrop.classList.add('opacity-0', 'pointer-events-none');
    // Achicamos la tarjeta para el efecto de cierre
    modalCard.classList.add('scale-95');
}

// Escuchadores de clics
btnComoFunciona.addEventListener('click', abrirModal);
btnCerrarModalX.addEventListener('click', cerrarModal);
btnCerrarModal.addEventListener('click', cerrarModal);

// ¡Detalle Pro! Cerrar el modal si el usuario hace clic afuera de la tarjeta (en lo oscuro)
modalBackdrop.addEventListener('click', (evento) => {
    if (evento.target === modalBackdrop) {
        cerrarModal();
    }
});