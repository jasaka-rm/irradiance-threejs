import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from "lil-gui"
import tmy from './tmy.js'
import SunCalc from 'suncalc'
import { ProgressiveLightMap } from 'three/examples/jsm/misc/ProgressiveLightMap.js'
import { base_cube, top_cube } from './objects.js'
import testVertexShader from './shaders/vertex.glsl'
import testFragmentShader from './shaders/fragment.glsl'

/**
 * Base
 */
// Variables
let date_time, pos, pos_altitude, pos_azimuth
let params = { 'Show Texture': true, 'Apply Colormaps': true, 'Accumulate 360º shadows': accumulateShadows,
'Accumulate real sun shadows': accumulateSunShadows, hours: 12, colorMap: 'Heatmap'   }
const mouse = new THREE.Vector2()
const maxIrradiance = 1525.25
const firstHourYear_ms = Math.floor(new Date('2022-01-01T00:00:00'))
const coordinates = { lat: 40.45338, long: -3.72696}
const lightMapRes = 1024 
let camera, scene, renderer, controls, progressiveSurfacemap, flag = false
const lightmapObjects = []
const colormap_themes = [ 'rainbow', 'blackbody', 'grayscale', 'cooltowarm', 'Heatmap', 'Heatmap_worse' ]


// Debug
const gui = new GUI({ closed: false, name: 'Settings' } )

// Canvas
const canvas = document.querySelector('canvas.webgl')
let text = document.querySelector('.info_text')

// Scene
scene = new THREE.Scene()

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight }

// Renderer
renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

// Camera
camera = new THREE.OrthographicCamera(sizes.width / - 8, sizes.width / 8, sizes.height / 8, sizes.height / - 8, 1, 1000 )
camera.position.set(80, -130, 100)
camera.up.set( 0, 0, 1 )

// Controls
controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.update()

// Axes Helper -> Y(x): green - X(z): Red - Z(y): Blue
// const axesHelper = new THREE.AxesHelper(100)
// scene.add(axesHelper)

// Progressive lightmap
progressiveSurfacemap = new ProgressiveLightMap( renderer, lightMapRes )

/**
 * Lights
 */
// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.0)
scene.add(ambientLight)
lightmapObjects.push( ambientLight )

// Ambient Light 2
const ambientLight_2 = new THREE.AmbientLight(0xffffff, 0.0)
scene.add(ambientLight_2)

// Directional Light 1
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5)
updateSunPosition()
scene.add(directionalLight1)
directionalLight1.castShadow = true
directionalLight1.shadow.mapSize.width = 1024
directionalLight1.shadow.mapSize.height = 1024
directionalLight1.shadow.camera.near = 1
directionalLight1.shadow.camera.far = 200
directionalLight1.shadow.camera.top = 150
directionalLight1.shadow.camera.right = 150
directionalLight1.shadow.camera.bottom = - 150
directionalLight1.shadow.camera.left = - 150

// Materials
const material = new THREE.MeshPhysicalMaterial( {
    side: THREE.FrontSide,
    clearcoat: 0.0,
    reflectivity: 0.0,
    sheen: 0.0,
    specularIntensity: 0.0,
    color: new THREE.Color(0xffffff),
})

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    material
)
ground.receiveShadow = true
ground.castShadow = true
lightmapObjects.push( ground )
scene.add( ground )

// Imported cubes
lightmapObjects.push( ...base_cube.children )
scene.add( base_cube )

lightmapObjects.push( ...top_cube.children )
scene.add( top_cube )

// Texture, render target
var rtTexture = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
    }
)

// Shader
const shader_mesh = new THREE . Mesh (
	new THREE.PlaneGeometry(2, 2),
	new THREE.ShaderMaterial({
		uniforms: {
			u_texture: { type : 't' , value : null },
			u_colorMap: { type : 'i' , value : 0 }
		},
        vertexShader   : testVertexShader,
		fragmentShader : testFragmentShader,
	})
)
const shader_scene = new THREE.Scene()
shader_scene.add( shader_mesh )

// To auto-adjust the window size
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = renderer.domElement.clientWidth
    sizes.height = renderer.domElement.clientHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Functions
*/
// Calculate a position-vector
function createPositionVector (azimuth, elevation, distance){
    azimuth = THREE.MathUtils.degToRad(azimuth)
    elevation = THREE.MathUtils.degToRad(elevation)

    const vector = new THREE.Vector3(
        Math.sin(azimuth) * Math.cos(elevation),
        Math.cos(azimuth) * Math.cos(elevation),
        Math.sin(elevation))
    return vector.multiplyScalar(distance)
}

// AssertEqual
function assertEqualColor (x, y){
    for(let i=0; i<x.length; i++){
        var diff = Math.abs( x[i] - y[i] )
        if( diff > 0.0000001 ) {
            console.error(x, y)
            console.log(x[i] - y[i])
            throw "Miscalculated"
        }
    }
    console.log("OK")
}

function updateSunPosition(){
    date_time = new Date(firstHourYear_ms + params.hours * 3600000)
    pos = SunCalc.getPosition(
        date_time,
        coordinates.lat,
        coordinates.long
    )
    
    pos_altitude = THREE.MathUtils.radToDeg(pos.altitude)
    pos_azimuth = THREE.MathUtils.radToDeg(pos.azimuth) + 180

    directionalLight1.position.set( 
        ...createPositionVector(
            pos_azimuth,
            pos_altitude,
            100
        )
    )
    const data = tmy["outputs"]["tmy_hourly"][params.hours]
    directionalLight1.intensity = data["Gb(n)"] / maxIrradiance
    ambientLight.intensity = data["Gd(h)"] / maxIrradiance
}


// Execute trials
function runTests(){
    validations.val1()
    validations.val2()
    validations.val3()
    validations.val4()
    validations.val5()
    validations.origin()
}

// Trials
const validations = {
    origin: () => // Simple-scene environment
    {
        ambientLight.intensity = 0.2
        directionalLight1.intensity = 1
        directionalLight1.position.set( ...createPositionVector(0, 45, 40))
        directionalLight2.intensity = 1
        directionalLight2.position.set( ...createPositionVector(45, 45, 40))
        camera.position.set(50, -100, 70)
        camera.lookAt(0, 0, 0)
    },
    val1: () => // Tests 1.1, 1.2, 1.3
    {
        camera.position.set(0, 0, 40)
        camera.lookAt(0, 0, 0)

        // Test 1.1: Ambient Light 0 view on cube tape
        ambientLight.intensity = 0
        directionalLight1.intensity = 0
        directionalLight2.intensity = 0

        console.log("The result of test 1.1 must be 0")
        let reading = capture()
        assertEqualColor(reading, [0,0,0])


        // Test 1.2: Ambient Light 0.2 view on cube tape
        ambientLight.intensity = 0.2
        directionalLight1.intensity = 0
        directionalLight2.intensity = 0

        console.log("The result of test 1.2 must be 0.2")
        reading = capture()
        assertEqualColor(reading, [0.2,0.2,0.2])

        // Test 1.3: Ambient Light 0.4 view on cube tape
        ambientLight.intensity = 0.4
        directionalLight1.intensity = 0
        directionalLight2.intensity = 0

        console.log("The result of test 1.3 must be 0.4")
        reading = capture()
        assertEqualColor(reading, [0.4,0.4,0.4])
    },

    val2: () => // Tests 2.1, 2.2, 2.3 - Directional Light 90º
    {
        ambientLight.intensity = 0
        directionalLight1.intensity = 1
        directionalLight1.position.set( ...createPositionVector(0, 90, 40))
        directionalLight2.intensity = 0

        // Test 2.1:  view on cube tape
        camera.position.set(0, 0, 40)
        camera.lookAt(0, 0, 0)
        console.log("The result of test 2.1 must be 1")
        let reading = capture()
        assertEqualColor(reading, [1,1,1])

        // Test 2.2: view on cube lateral side
        camera.position.set(0, 40, 10)
        camera.lookAt(0, 0, 10)
        console.log("The result of test 2.2 must be 0")
        reading = capture()
        assertEqualColor(reading, [0,0,0])

        // Test 2.3: view on plane
        camera.position.set(20, 20, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 2.3 must be 1")
        reading = capture()
        assertEqualColor(reading, [1,1,1])
    },

    val3: () => // Tests 3.1, 3.2, 3.3, 3.4 - Directional Light 30º
    {
        ambientLight.intensity = 0
        directionalLight1.intensity = 1
        directionalLight1.position.set( ...createPositionVector(0, 30, 40))
        directionalLight2.intensity = 0

        // Test 3.1: view on cube tape
        camera.position.set(0, 0, 40)
        camera.lookAt(0, 0, 0)
        console.log("The result of test 3.1 must be sin(30)=0.5")
        let reading = capture()
        assertEqualColor(reading, [0.5,0.5,0.5])

        // Test 3.2: view on cube lateral side no-light
        camera.position.set(80, 0, 10)
        camera.lookAt(0, 0, 10)
        console.log("The result of test 3.2 must be 0")
        reading = capture()
        assertEqualColor(reading, [0,0,0])

        // Test 3.3: view on light plane
        camera.position.set(20, 20, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 3.3 must be sin(30)=0.5")
        reading = capture()
        assertEqualColor(reading, [0.5,0.5,0.5])

        // Test 3.4: view on no-light plane
        camera.position.set(0, - 20, 40) // look at the complete shadow
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 3.4 must be 0")
        reading = capture()
        assertEqualColor(reading, [0,0,0])
    },


    val4: () => // Tests 4.1, 4.2, 4.3, 4.4 - Directional Light 30º + Ambient Light 
    {
        ambientLight.intensity = 0.2
        directionalLight1.intensity = 1
        directionalLight1.position.set( ...createPositionVector(0, 30, 40))
        directionalLight2.intensity = 0

        // Test 4.1: view on cube tape
        camera.position.set(0, 0, 40)
        camera.lookAt(0, 0, 0)
        console.log("The result of test 4.1 must be 0.5 + 0.2 = 0.7")
        let reading = capture()
        assertEqualColor(reading, [0.7,0.7,0.7])

        // Test 4.2: view on cube lateral side no-light
        camera.position.set(80, 0, 10)
        camera.lookAt(0, 0, 10)
        console.log("The result of test 4.2 must be 0.2 (intensity of the ambient light)")
        reading = capture()
        assertEqualColor(reading, [0.2,0.2,0.2])

        // Test 4.3: view on light plane
        camera.position.set(20, 20, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 4.3 must be 0.5 + 0.2 = 0.7")
        reading = capture()
        assertEqualColor(reading, [0.7,0.7,0.7])

        // Test 4.4: view on no-light plane
        camera.position.set(0, - 20, 40) // look at the complete shadow
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 4.4 must be 0.2 (intensity of the ambient light)")
        reading = capture()
        assertEqualColor(reading, [0.2,0.2,0.2])
    },

    val5: () => // Tests 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 - 2xDirectional Light 30º + Ambient Light view on cube tape
    {
        ambientLight.intensity = 0.2
        directionalLight1.intensity = 1
        directionalLight1.position.set( ...createPositionVector(0, 30, 40))
        directionalLight2.intensity = 1
        directionalLight2.position.set( ...createPositionVector(45, 30, 40))

        // Test 5.1: view on cube tape
        camera.position.set(0, 0, 40)
        camera.lookAt(0, 0, 0)
        console.log("The result of test 5.1 must be 0.2 + 0.5 + 0.5 = 1.2")
        let reading = capture()
        assertEqualColor(reading, [1.2,1.2,1.2])

        // Test 5.2: view on cube lateral side more-light
        camera.position.set(80, 0, 10)
        camera.lookAt(0, 0, 10)
        console.log("The result of test 5.2 must be cos(30) * sin(45) + 0.2 = 0.81237")
        reading = capture()
        assertEqualColor(reading, [0.812372436,0.812372436,0.812372436])

        // Test 5.3: view on cube lateral side less-light
        camera.position.set(- 80, 0, 10)
        camera.lookAt(0, 0, 10)
        console.log("The result of test 5.3 must be 0.2 (intensity of the ambient light)")
        reading = capture()
        assertEqualColor(reading, [0.2,0.2,0.2])

        // Test 5.4: view on light plane
        camera.position.set(40, 40, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 5.4 must be 0.2 + 0.5 + 0.5 = 1.2")
        reading = capture()
        assertEqualColor(reading, [1.2,1.2,1.2])

        // Test 5.5: view on medium-light plane
        camera.position.set(- 20, - 20, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 5.5 must be 0.5 + 0.2 = 0.7")
        reading = capture()
        assertEqualColor(reading, [0.7,0.7,0.7])

        // Test 5.6: view on less-light plane
        camera.position.set(- 5, - 15, 40)
        camera.lookAt(camera.position.x, camera.position.y, 0)
        console.log("The result of test 5.6 must be 0.2 (intensity of the ambient light)")
        reading = capture()
        assertEqualColor(reading, [0.2,0.2,0.2])
    }
}

// Capture the pixel on the middle of the window
function capture()
{
    renderer.clear()
    renderer.setRenderTarget( rtTexture )
    renderer.render( scene, camera )

    renderer.setRenderTarget( null )
    renderer.render( scene, camera )

    var read = new Float32Array( 4 )
    renderer.readRenderTargetPixels( rtTexture, sizes.width / 2 , sizes.height / 2, 1, 1, read )

    return read
}

// Debug
gui.add(ambientLight_2, 'intensity', ).min(0).max(2).step(0.01).name('Intensity ambient light')
gui.add( params, 'Apply Colormaps' )
gui.add( params, 'Show Texture' )
gui.add( params, 'Accumulate 360º shadows' )
gui.add( params, 'Accumulate real sun shadows' )
gui.add( params, 'hours', 0, 8759, 1 ).name("Hour of the year").onChange( hour => {
    updateSunPosition()
} )
gui.add( params, 'colorMap', colormap_themes ).onChange( function () {
    renderer.render(scene, camera)
} )


// Capture pixel color of the mouse position
renderer.domElement.addEventListener('mousemove', (event) =>
{
    mouse.x = event.offsetX
    mouse.y = canvas.clientHeight - event.offsetY

    // Render first scene into texture
    renderer.clear()
    renderer.setRenderTarget( rtTexture )
    renderer.render( scene, camera )

    // Render full screen quad with generated texture
    renderer.setRenderTarget( null )
    renderer.render( scene, camera )

    var read = new Float32Array( 4 )
    renderer.readRenderTargetPixels( rtTexture, mouse.x, mouse.y, 1, 1, read )

    text.innerHTML = 'Pixel color is:' + '<br/>r = ' + read[ 0 ] + '<br/>g = ' + read[ 1 ] + '<br/>b = ' + read[ 2 ]
}) 
renderer.render(scene, camera)


// Accumulates a fixed number of shadows. Check linearity.
function accumulateShadows (){

    // Turn off the start-up lights
    ambientLight_2.intensity = 0
    directionalLight1.intensity = 0
    flag = true

    // create 10 directional lights to speed up the convergence
    const lightCount = 10
    const dirLight = []
    for ( let l = 0; l < lightCount; l ++ ) {

        dirLight.push( dirLight[l] )
        // dirLight[l] = new THREE.DirectionalLight( 0xffffff, 1.0 / lightCount )
        dirLight[l] = new THREE.DirectionalLight( 0xffffff, 0.0)
        dirLight[l].position.set( ...createPositionVector(l, 30, 200))
        dirLight[l].castShadow = true

        dirLight[l].shadow.camera.near = 1
        dirLight[l].shadow.camera.far = 400
        dirLight[l].shadow.camera.right = 150
        dirLight[l].shadow.camera.left = - 150
        dirLight[l].shadow.camera.top = 150
        dirLight[l].shadow.camera.bottom = - 150
        dirLight[l].shadow.mapSize.width = 1024
        dirLight[l].shadow.mapSize.height = 1024

        lightmapObjects.push( dirLight[l] )
        scene.add(dirLight[l])
    }

    // Add those lights to the progressiveSurfacemap
    progressiveSurfacemap.addObjectsToLightMap( lightmapObjects )

    // Loop to accumulate 10 lights at a time during 180º
    let angle = 0
    while (angle < 360){

        console.log(angle)
        for ( let l = 0; l < lightCount; l ++ ) {
            dirLight[l].intensity = 1.0 / lightCount
            dirLight[l].position.set( ...createPositionVector(angle, 30, 200))
            angle += 1 / lightCount  //0.1º
        }

        // Accumulate shadows
        progressiveSurfacemap.update( camera, 360, true );
    }
    
    // Turn off the directional lights just in case
    for ( let l = 0; l < lightCount; l ++ ) {
        dirLight[l].intensity = 0
    }

    progressiveSurfacemap.showDebugLightmap( params[ 'Show Texture' ], new THREE.Vector3(0,0,90) )
    console.log(progressiveSurfacemap.labelMesh.material.map)
    ambientLight_2.intensity = 0.5
}

// Accumulates real sun position shadows
function accumulateSunShadows (){

    var startTime = performance.now();


    // Turn off the start-up lights
    ambientLight_2.intensity = 0
    directionalLight1.intensity = 0
    flag = true

    // create 10 directional lights to speed up the convergence
    const lightCount = 10
    let dirLight = []
    for ( let l = 0; l < lightCount; l ++ ) {

        dirLight.push( dirLight[l] )
        dirLight[l] = new THREE.DirectionalLight( 0xffffff, 0.0)
        dirLight[l].castShadow = true

        dirLight[l].shadow.camera.near = 1
        dirLight[l].shadow.camera.far = 400
        dirLight[l].shadow.camera.right = 150
        dirLight[l].shadow.camera.left = - 150
        dirLight[l].shadow.camera.top = 150
        dirLight[l].shadow.camera.bottom = - 150
        dirLight[l].shadow.mapSize.width = 1024
        dirLight[l].shadow.mapSize.height = 1024

        lightmapObjects.push( dirLight[l] )
        scene.add(dirLight[l])
    }

    // Add those lights to the progressiveSurfacemap
    progressiveSurfacemap.addObjectsToLightMap( lightmapObjects )

    // Accumulate X hours of sun positions
    let positions = 0
    while (positions < 876){    // 876, almost a year, 12 positions is 5 days

        // Update sun position v2
        for ( let l = 0; l < lightCount; l ++ ) {     // Loop to accumulate 10 lights at a time

            date_time = new Date(firstHourYear_ms + (positions*10 + l) * 3600000) 
            // date_time = new Date(firstHourYear_ms + (positions*10 + l + 4343) * 3600000) // to simulate from July 1st
            console.log(date_time)
            pos = SunCalc.getPosition(
                date_time,
                coordinates.lat,
                coordinates.long
            )
            
            pos_altitude = THREE.MathUtils.radToDeg(pos.altitude)
            pos_azimuth = THREE.MathUtils.radToDeg(pos.azimuth) + 180


            dirLight[l].position.set( 
                ...createPositionVector(
                    pos_azimuth,
                    pos_altitude,
                    200
                )
            )
            const data = tmy["outputs"]["tmy_hourly"][positions+l]
            dirLight[l].intensity = data["Gb(n)"] / maxIrradiance
            ambientLight.intensity = data["Gd(h)"] / maxIrradiance
        }

        positions += 1
        
        // Accumulate shadows
        progressiveSurfacemap.update( camera, 876, true );
    }
    
    // Turn off the directional lights just in case
    for ( let l = 0; l < lightCount; l ++ ) {
        dirLight[l].intensity = 0
    }

    progressiveSurfacemap.showDebugLightmap( params[ 'Show Texture' ], new THREE.Vector3(0,0,90) )
    ambientLight_2.intensity = 0.6
    positions = 0


    var endTime = performance.now();
    var elapsedTime = endTime - startTime;
    console.log('Tiempo de ejecución: ' + elapsedTime + 'ms');

}


/**
 * Animate
 */ 
animate()

function render() {

    // Update the inertia on the orbit controls
    controls.update();

    // Apply different colormaps
    if ( params [ 'Apply Colormaps' ] ) {
        renderer.setRenderTarget( rtTexture )
        renderer.render( scene, camera )
        
        shader_mesh.material.uniforms.u_texture  = { type : 't', value: rtTexture.texture } 
        shader_mesh.material.uniforms.u_colorMap = { type : 'i', value: colormap_themes.indexOf( params.colorMap ) } 
        
        renderer.setRenderTarget( null )
        renderer.render( shader_scene, camera )
    } else {
        renderer.setRenderTarget( null )
        renderer.render( scene, camera )
    }
        
    if (flag){
        progressiveSurfacemap.showDebugLightmap( params[ 'Show Texture' ], new THREE.Vector3(0,0,90) )
    }

}

function animate() {
    requestAnimationFrame( animate )
    render()
}
