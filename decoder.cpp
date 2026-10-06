#include <iostream>
#include <string>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

int main() {
    int width, height, channels;
    // Cargamos la imagen que tiene el mensaje oculto
    unsigned char* img_data = stbi_load("output.png", &width, &height, &channels, 0);

    if (img_data == NULL) {
        std::cout << "Error: No se encontro output.png\n";
        return 1;
    }

    // --- NUESTRA LLAVE MAESTRA ---
    std::string clave = "GATO"; 
    // -----------------------------

    int byteActual = 0;
    int indiceClave = 0; // Para saber qué letra de la clave usar ("G", "A", "T", "O")

    std::cout << "Decodificando mensaje secreto...\n\n";
    std::cout << "Mensaje: ";

    while (true) {
        
        char letra_encriptada = 0; // Empezamos con 00000000

        // 1. LEER LOS 8 BITS DE LA IMAGEN
        for (int j = 0; j < 8; j++) {
            int bit = img_data[byteActual] & 1; // Sacamos el LSB
            letra_encriptada = letra_encriptada | (bit << j); // Lo acomodamos
            byteActual++;
        }

        // 2. EL CENTINELA: ¿Llegamos al final?
        // Recordá que al '\0' lo guardamos puro, sin encriptar.
        if (letra_encriptada == '\0') {
            break; // Salimos del bucle while
        }

        // 3. DESENCRIPTAR CON XOR
        // Aplicamos la misma magia matemática para revertir la basura a la letra original
        char letra_original = letra_encriptada ^ clave[indiceClave % clave.length()];

        // 4. IMPRIMIR Y AVANZAR
        std::cout << letra_original;
        indiceClave++; // Avanzamos a la siguiente letra de la clave
    }

    std::cout << "\n\nFin del mensaje.\n";

    stbi_image_free(img_data);
    return 0;
}