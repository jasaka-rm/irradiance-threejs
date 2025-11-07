uniform sampler2D u_texture;
uniform int u_colorMap;

varying vec2 v_uv; 

vec3 heatmapGradient(float t) {
	return clamp(
                (pow(t, 1.5) * 0.8 + 0.2) * 
                    vec3(smoothstep(0.0, 0.35, t) + t * 0.5, 
                        smoothstep(0.5, 1.0, t), 
                        max(1.0 - t * 1.7, t * 7.0 - 6.0)), 
                0.0, 
                1.0);
}

vec3 blackbody(float t) {
    float p = pow(t, -1.5);
    float l = log(t);
    
	vec3 color;
    color.r = 220000.0 * p + 0.5804;
    color.g = 0.3923 * l - 2.4431;
    if (t > 6500.0) 
		color.g = 138039.0 * p + 0.738;
    color.b = 0.7615 * l - 5.681;
    
    color = clamp(color, 0.0, 1.0);
    
    if (t < 1000.0) 
		color *= t/1000.0;
        
    return color;
}


void main () {
    vec4  pixel      = texture2D ( u_texture , v_uv ) ; 
    float grey_pixel = ( pixel.r + pixel.g + pixel.b ) / 3.0 ; 
    
    float r = 0.0 ;
    float g = 0.0 ;
    float b = 0.0 ;

    switch ( u_colorMap ) {
        case 0 : { // rainbow roygbv
            float rs [ 6 ]   = float []  ( .75 , .75   , .75 , 0. , 0. , .75 ) ;
            float gs [ 6 ]   = float []  ( 0. ,  .64 , .75 , .75 , 0. , 0. ) ;
            float bs [ 6 ]   = float []  ( 0. , 0.   , 0. , 0. , .75 , .75 ) ;
            int   i          = int       ( grey_pixel * 6. ) ; 
            if ( i > 4 ) i   = 4 ;
            r = rs [ i ] + ( rs [ i + 1 ] - rs [ i ] ) * grey_pixel ;
            g = gs [ i ] + ( gs [ i + 1 ] - gs [ i ] ) * grey_pixel ;
            b = bs [ i ] + ( bs [ i + 1 ] - bs [ i ] ) * grey_pixel ;

            gl_FragColor   = vec4 ( r , g , b , 1.0 ) ;
        } break ;
        
        case 1 : { // black body
            float rs [ 3 ]   = float []  ( 0.0 , 1.0 , 1.0 ) ;
            float gs [ 3 ]   = float []  ( 0.0 , 0.0 , 1.0 ) ;
            float bs [ 3 ]   = float []  ( 0.0 , 0.0 , 0.0 ) ;
            int   i          = int       ( grey_pixel * 3.0 - .5 ) ; 
            if ( i > 1 ) i   = 1 ;
            r = rs [ i ] + ( rs [ i + 1 ] - rs [ i ] ) * grey_pixel ;
            g = gs [ i ] + ( gs [ i + 1 ] - gs [ i ] ) * grey_pixel ;
            b = bs [ i ] + ( bs [ i + 1 ] - bs [ i ] ) * grey_pixel ;

            gl_FragColor   = vec4 ( r , g , b , 1.0 ) ;
        } break ;
        
        case 2 : { // grey
            r = grey_pixel ;
            g = grey_pixel ;
            b = grey_pixel ;

            gl_FragColor   = vec4 ( r , g , b , 1.0 ) ;
        }  break ;
        
        case 3 : { // cool to warm
            float rs [ 2 ]   = float []  ( 0. , 1. ) ;
            float gs [ 2 ]   = float []  ( 0. , 0. ) ;
            float bs [ 2 ]   = float []  ( 1. , 0. ) ;
            int   i          = 0 ;					
            r = rs [ i ] + ( rs [ i + 1 ] - rs [ i ] ) * grey_pixel ;
            g = gs [ i ] + ( gs [ i + 1 ] - gs [ i ] ) * grey_pixel ;
            b = bs [ i ] + ( bs [ i + 1 ] - bs [ i ] ) * grey_pixel ;

            gl_FragColor   = vec4 ( r , g , b , 1.0 ) ;
        } break ;

        case 4 : { // my colormap
            gl_FragColor   = vec4 ( heatmapGradient(grey_pixel), 1.0 ) ;
        } break ;

        case 5 : { // my colormap_bad
            gl_FragColor   = vec4 ( blackbody(grey_pixel * 1000.0 + 300.0) , 1.0 ) ;
        } break ;
    }

}