varying vec2 v_uv ;

void main () {
    v_uv = uv ;     // Como necesitamos el attribute uv (las coordenadas uv) en el fragment shader, hay que pasárselas mediante un varying
                    // y le pasamos su valor aquí en el main
    gl_Position = vec4 ( position , 1. ) ;      // Contiene la posición de los vértices en la escena
}