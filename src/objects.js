import * as THREE from 'three'

const material = new THREE.MeshPhysicalMaterial( {
    side: THREE.FrontSide,
    clearcoat: 0.0,
    reflectivity: 0.0,
    sheen: 0.0,
    specularIntensity: 0.0,
    color: new THREE.Color(0xffffff),
})

/**
 * Cube made with planes 1 (Base)
 */
// plane  -  -Green
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 60, 20),
    material
);
plane.position.set(0, -30, 10)
plane.rotation.x = + Math.PI / 2
plane.receiveShadow = true
plane.castShadow = true

// plane 1  -  +Green
const plane1 = new THREE.Mesh(
    new THREE.PlaneGeometry( 60, 20 ),
    material
);
plane1.position.set(0, 30, 10)
plane1.rotation.x = - Math.PI / 2
plane1.receiveShadow = true
plane1.castShadow = true

// plane 2  -  +Red
const plane2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 60 ),
    material
);
plane2.position.set(30, 0, 10)
plane2.rotation.y = + Math.PI / 2
plane2.receiveShadow = true
plane2.castShadow = true

// plane 3  -  -Red
const plane3 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 60 ),
    material
);
plane3.position.set(-30, 0, 10)
plane3.rotation.y = - Math.PI / 2
plane3.receiveShadow = true
plane3.castShadow = true

// plane 4  -  +Blue
const plane4 = new THREE.Mesh(
    new THREE.PlaneGeometry( 60, 60 ),
    material
);
plane4.position.set(0, 0, 20)
plane4.receiveShadow = true
plane4.castShadow = true

// Group base
export const base_cube = new THREE.Group()
base_cube.add( plane, plane1, plane2, plane3, plane4 )


/**
 * Cube made with planes 2 (top)
 */
// plane  -  -Green
const plane_2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20),
    material
);
plane_2.position.set(0, -10, 30)
plane_2.rotation.x = + Math.PI / 2
plane_2.receiveShadow = true
plane_2.castShadow = true

// plane 1  -  +Green
const plane1_2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20 ),
    material
);
plane1_2.position.set(0, 10, 30)
plane1_2.rotation.x = - Math.PI / 2
plane1_2.receiveShadow = true
plane1_2.castShadow = true

// plane 2  -  +Red
const plane2_2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20 ),
    material
);
plane2_2.position.set(10, 0, 30)
plane2_2.rotation.y = + Math.PI / 2
plane2_2.receiveShadow = true
plane2_2.castShadow = true

// plane 3  -  -Red
const plane3_2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20 ),
    material
);
plane3_2.position.set(-10, 0, 30)
plane3_2.rotation.y = - Math.PI / 2
plane3_2.receiveShadow = true
plane3_2.castShadow = true

// plane 4  -  +Blue
const plane4_2 = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20 ),
    material
);
plane4_2.position.set(0, 0, 40)
plane4_2.receiveShadow = true
plane4_2.castShadow = true

// Group top
export const top_cube = new THREE.Group()
top_cube.add( plane_2, plane1_2, plane2_2, plane3_2, plane4_2 )
