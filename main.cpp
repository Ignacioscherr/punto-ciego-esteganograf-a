#define _WIN32_WINNT 0x0A00

#include <iostream>
#include <vector>
#include <string>


#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"


#include "httplib.h" 
using namespace std;

int obtener_bit(char byte, int posicion) { return (byte >> posicion) & 1; }
unsigned char inyectar_bit(unsigned char pixel, int bit) { return (pixel & 254) | bit; }
void atajar_bytes(void *context, void *data, int size) {
    static_cast<string*>(context)->append(static_cast<char*>(data), size);
}
// OCULTAR
string procesar_esteganografia(const string& imagen_cruda, string mensaje, const string& clave) {
    mensaje = "PC|" + mensaje;
    
    int w, h, c;
    unsigned char* img_data = stbi_load_from_memory(
        reinterpret_cast<const unsigned char*>(imagen_cruda.data()), 
        imagen_cruda.length(), &w, &h, &c, 0
    );
    if (!img_data) return ""; 

    if ((mensaje.length() + 1) * 8 > (w * h * c)) {
        stbi_image_free(img_data);
        return "";
    }

    mensaje.push_back('\0');
    
    long long salto = 0;
    for (char c : clave) salto += c;
    if (salto % 2 == 0) salto += 1;
    
    int byteActual = 0; 
    char anterior = 0;
    
    for (int i = 0; i < mensaje.length(); i++) {
        char letra = (mensaje[i] == '\0') ? '\0' : (mensaje[i] ^ clave[i % clave.length()] ^ anterior); 
        if (mensaje[i] != '\0') anterior = letra;
        
        for (int j = 0; j < 8; j++) {
            img_data[byteActual + j] = inyectar_bit(img_data[byteActual + j], obtener_bit(letra, j));
        }
        
        salto = salto + (unsigned char)letra;
        byteActual = (byteActual + 8 + salto) % (w * h * c - 8);
    }
    string imagen_procesada = "";
    stbi_write_png_to_func(atajar_bytes, &imagen_procesada, w, h, c, img_data, w * c);
    stbi_image_free(img_data);
    return imagen_procesada;
}

// REVELAR
// --- MOTOR: REVELAR ---
string revelar_esteganografia(const string& imagen_cruda, const string& clave) {
    int w, h, c;
    unsigned char* img_data = stbi_load_from_memory(
        reinterpret_cast<const unsigned char*>(imagen_cruda.data()), 
        imagen_cruda.length(), &w, &h, &c, 0
    );
    if (!img_data) return "";

    string msj = "";
    long long salto = 0;
    for (char c : clave) salto += c;
    if (salto % 2 == 0) salto += 1;
    
    int byteActual = 0, limite = w * h * c, idx_clave = 0;
    char anterior = 0;
    int iteraciones = 0;

    while (iteraciones < limite) {
        char letra = 0;
        for (int j = 0; j < 8; j++) {
            letra |= (obtener_bit(img_data[byteActual + j], 0) << j);
        }
        if (letra == '\0') break; 
        
        char letra_limpia = letra ^ clave[idx_clave++ % clave.length()] ^ anterior;
        anterior = letra;
        msj += letra_limpia;
        
        salto = salto + (unsigned char)letra;
        byteActual = (byteActual + 8 + salto) % (limite - 8);
        iteraciones++;
    }
    stbi_image_free(img_data);


    if (msj.length() >= 3 && msj.substr(0, 3) == "PC|") {
        return msj.substr(3); 
    }
    return ""; 
}

int main() {
    httplib::Server servidor;
    cout << "Iniciando Boveda Secreta..." << endl;

    // Servir los archivos web de la carpeta public (index.html, app.js, logo.png)
    servidor.set_mount_point("/", "./public");

    //CORS
   servidor.Options("/(.*)", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "X-Mensaje, X-Clave, Content-Type"); 
    });
    // 2. RUTA OCULTAR
    servidor.Post("/ocultar", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");

        // Leemos nuestros Headers personalizados
        if (!req.has_header("X-Mensaje") || !req.has_header("X-Clave")) {
            res.status = 400; 
            res.set_content("Faltan los headers de seguridad.", "text/plain"); 
            return;
        }

        string msj = req.get_header_value("X-Mensaje");
        string clave = req.get_header_value("X-Clave");
        string foto_cruda = req.body; 

        string resultado = procesar_esteganografia(foto_cruda, msj, clave);
        
        if (resultado.empty()) {
            res.status = 500; 
            res.set_content("Error interno.", "text/plain"); 
            return;
        }
        res.set_content(resultado, "image/png");
        cout << "[+] Imagen encriptada enviada.\n";
    });

    // 3. RUTA REVELAR
    servidor.Post("/revelar", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        
        if (!req.has_header("X-Clave")) {
            res.status = 400; 
            res.set_content("Falta la clave.", "text/plain"); 
            return;
        }

        string clave = req.get_header_value("X-Clave");
        string foto_cruda = req.body;

        string msj = revelar_esteganografia(foto_cruda, clave);
        
        if (msj.empty()) {
            res.status = 500; 
            res.set_content("No se encontro mensaje o clave incorrecta.", "text/plain"); 
            return;
        }
        res.set_content(msj, "text/plain");
        cout << "[+] Mensaje revelado.\n";
    });

    int puerto = 8080;
    const char* env_p = getenv("PORT");
    if (env_p != nullptr) {
        puerto = atoi(env_p);
    }

    cout << "Servidor activo en el puerto " << puerto << endl;
    servidor.listen("0.0.0.0", puerto);
    return 0;
}