import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { Color, Raycaster } from 'three'
import { Mesh } from './three'
import { gsap } from 'gsap'
/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
//intro
const loadingManager=new THREE.LoadingManager()

const progressBar = document.getElementById('progress-bar')
loadingManager.onProgress=(url,loaded,total)=>{
progressBar.value=(loaded/total)*100
}

const progressBarContainer=document.querySelector('.progress-bar-container')
loadingManager.onLoad=()=>{
progressBarContainer.style.display='none'
}


//photos
const textureloader= new THREE.TextureLoader(loadingManager)
const photo1 = textureloader.load('/starry-nights.jpg')
const photo2 = textureloader.load('/IEEELOGO.png')
const IEEELOGO = textureloader.load('/IEEELOGO.png')
const learnmorephoto = textureloader.load('/learnmore.png')
const blackphoto = textureloader.load('/blackphoto.png')
const mainblack = textureloader.load('/mainblack.png')
const hrphoto = textureloader.load('/hrphoto.png')
const FRphoto = textureloader.load('/FRphoto.png')
const PRphoto = textureloader.load('/PRphoto.png')
const Multimediaphoto = textureloader.load('/Multimediaphoto.png')
const SMMphoto = textureloader.load('/SMMphoto.png')
const Campusphoto = textureloader.load('/Campusphoto.png')
const IEEEpic1 = textureloader.load('/photo1.png')
const IEEEpic2 = textureloader.load('/photo2.png')
const IEEEpic3 = textureloader.load('/photo3.png')
const IEEEpic4 = textureloader.load('/photo4.png')
const IEEEOfficerspic = textureloader.load('/IEEEOfficerspic.png')
const Contactphoto = textureloader.load('/Contactphoto.png')


//script for mouse interactions 
class MouseMeshInteractionHandler {
	constructor(mesh_name, handler_function) {
		this.mesh_name = mesh_name;
		this.handler_function = handler_function;
	}
}

class MouseMeshInteraction {
	constructor(scene, camera) {
		this.scene = scene;
		this.camera = camera;
		
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		
		this.updated = false;
		this.event = '';
		
		// last mesh that the mouse cursor was over
		this.last_mouseenter_mesh = undefined;
		// last mesh that the mouse was pressing down
		this.last_pressed_mesh = undefined;
		
		this.handlers = new Map();
		
		this.handlers.set('click', []);
		this.handlers.set('dblclick', []);
		this.handlers.set('contextmenu', []);
		
		this.handlers.set('mousedown', []);
		this.handlers.set('mouseup', []);
		this.handlers.set('mouseenter', []);
		this.handlers.set('mouseleave', []);
		
		window.addEventListener('mousemove', this);
		
		window.addEventListener('click', this);
		window.addEventListener('dblclick', this);
		window.addEventListener('contextmenu', this);
		
		window.addEventListener('mousedown', this);
	}
	
	handleEvent(e) {
		switch(e.type) {
			case "mousemove": {
				this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
				this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
				this.updated = true;
				this.event = 'motion';
			}
			break;
			default: {
				this.updated = true;
				this.event = e.type;
			}
		}
	}
	
	addHandler(mesh_name, event_type, handler_function) {
		if (this.handlers.has(event_type)) {
			this.handlers.get(event_type).push(new MouseMeshInteractionHandler(mesh_name, handler_function));
		}
	}
	
	update() {
		if (this.updated) {
			// update the picking ray with the camera and mouse position
			this.raycaster.setFromCamera(this.mouse, this.camera);
			
			// calculate objects intersecting the picking ray
			const intersects = this.raycaster.intersectObjects(this.scene.children, true);
			
			if (intersects.length > 0) {
				// special test for events: 'mouseenter', 'mouseleave'
				if (this.event === 'motion') {
					let mouseenter_handlers = this.handlers.get('mouseenter');
					let mouseleave_handlers = this.handlers.get('mouseleave');
					
					if (mouseleave_handlers.length > 0) {
						for (const handler of mouseleave_handlers) {
							// if mesh was entered by mouse previously, but not anymore, that means it has been mouseleave'd
							if (
								this.last_mouseenter_mesh !== undefined
								&& intersects[0].object !== this.last_mouseenter_mesh
								&& handler.mesh_name === this.last_mouseenter_mesh.name
							) {
								handler.handler_function(this.last_mouseenter_mesh);
								break;
							}
						}
					}
					
					if (mouseenter_handlers.length > 0) {
						for (const handler of mouseenter_handlers) {
							if (handler.mesh_name === intersects[0].object.name && intersects[0].object !== this.last_mouseenter_mesh) {
								this.last_mouseenter_mesh = intersects[0].object;
								handler.handler_function(intersects[0].object);
								break;
							}
						}
					}
				}
				else {
					// if mouseup event has occurred
					if (this.event === 'click' && this.last_pressed_mesh === intersects[0].object) {
						for (const handler of this.handlers.get('mouseup')) {
							if (handler.mesh_name === intersects[0].object.name) {
								handler.handler_function(intersects[0].object);
								break;
							}
						}
						this.last_pressed_mesh = undefined;
					}
					
					// for mouseup event handler to work
					if (this.event === 'mousedown') {
						this.last_pressed_mesh = intersects[0].object;
					}
					
					let handlers_of_event = this.handlers.get(this.event);
					for (const handler of handlers_of_event) {
						if (handler.mesh_name === intersects[0].object.name) {
							handler.handler_function(intersects[0].object);
							break;
						}
					}
				}
			}
			// if mouse doesn't intersect any meshes
			else if (this.event === 'motion') {
				// special test for 'mouseleave' event
				// 			(since it may be triggered when cursor doesn't intersect with any meshes)
				for (const handler of this.handlers.get('mouseleave')) {
					// if mesh was entered by mouse previously, but not anymore, that means it has been mouseleave'd
					if (this.last_mouseenter_mesh !== undefined && handler.mesh_name === this.last_mouseenter_mesh.name) {
						handler.handler_function(this.last_mouseenter_mesh);
						this.last_mouseenter_mesh = undefined;
						break;
					}
				}
			}
			
			this.updated = false;
		}
	}
}
//end script




//loader



const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.load(
    '/meetingRoom/scene.gltf',
    (gltf)=>{
       const pc =gltf.scene
       pc.receiveShadow=true
        scene.add(pc)
    }
)

//objects

const ieeeLogo=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2.5,1.2),
    new THREE.MeshBasicMaterial({map:IEEELOGO,
    transparent:true})
)
scene.add(ieeeLogo)
ieeeLogo.position.x=-1.237    
ieeeLogo.position.y=1
ieeeLogo.position.z=-1.4
ieeeLogo.rotation.x=0
ieeeLogo.rotation.y=Math.PI*0.5
ieeeLogo.rotation.z=0

const ieeeWeb=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1,1.3),
    new THREE.MeshBasicMaterial({map:learnmorephoto,
    transparent:true})
)
scene.add(ieeeWeb)
ieeeWeb.position.x=-0.45 
ieeeWeb.position.y=1
ieeeWeb.position.z=-3.28
ieeeWeb.rotation.x=0
ieeeWeb.rotation.y=-5.95
ieeeWeb.rotation.z=0

const webplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:blackphoto,
    transparent:true })
)
scene.add(webplane)
webplane.position.x=0.62
webplane.position.y=-0.14
webplane.position.z=0.9
webplane.rotation.x=-Math.PI*0.5 //-1.6
webplane.rotation.y=0
webplane.rotation.z=-2



const hrplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.3),
    new THREE.MeshBasicMaterial({map:hrphoto,
    transparent:true })
)
scene.add(hrplane)
hrplane.position.x=1.85
hrplane.position.y=-0.302
hrplane.position.z=0.8
hrplane.rotation.x=-Math.PI*0.5 
hrplane.rotation.y=0
hrplane.rotation.z=1.7



const FRplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:FRphoto,
    transparent:true })
)
scene.add(FRplane)
FRplane.position.x=2
FRplane.position.y=-0.309
FRplane.position.z=-0.78
FRplane.rotation.x=-Math.PI*0.5 
FRplane.rotation.y=0
FRplane.rotation.z=1.7

const PRplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:PRphoto,
    transparent:true })
)
scene.add(PRplane)
PRplane.position.x=1.94
PRplane.position.y=-0.31
PRplane.position.z=-2.92
PRplane.rotation.x=-Math.PI*0.5 
PRplane.rotation.y=0
PRplane.rotation.z=1.2

const Multimediaplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:Multimediaphoto,
    transparent:true })
)
scene.add(Multimediaplane)
Multimediaplane.position.x=4.3
Multimediaplane.position.y=-0.31
Multimediaplane.position.z=-0.6
Multimediaplane.rotation.x=-Math.PI*0.5 
Multimediaplane.rotation.y=0
Multimediaplane.rotation.z=2

const SMMplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:SMMphoto,
    transparent:true })
)
scene.add(SMMplane)
SMMplane.position.x=4.25
SMMplane.position.y=-0.31
SMMplane.position.z=-2.67
SMMplane.rotation.x=-Math.PI*0.5 
SMMplane.rotation.y=0
SMMplane.rotation.z=1.7

const Campusplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.3,0.4),
    new THREE.MeshBasicMaterial({map:Campusphoto,
    transparent:true })
)
scene.add(Campusplane)
Campusplane.position.x=4.45
Campusplane.position.y=-0.3
Campusplane.position.z=-4.2
Campusplane.rotation.x=-Math.PI*0.5 
Campusplane.rotation.y=0
Campusplane.rotation.z=1.1


const IEEEphoto1=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.34,0.45),
    new THREE.MeshBasicMaterial({map:IEEEpic1,
    transparent:true })
)
scene.add(IEEEphoto1)
IEEEphoto1.position.x=2.53
IEEEphoto1.position.y=0.594
IEEEphoto1.position.z=-5.289

const IEEEphoto2=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.34,0.45),
    new THREE.MeshBasicMaterial({map:IEEEpic2,
    transparent:true })
)
scene.add(IEEEphoto2)
IEEEphoto2.position.x=3.014
IEEEphoto2.position.y=1.39
IEEEphoto2.position.z=-5.289



const IEEEphoto3=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.34,0.45),
    new THREE.MeshBasicMaterial({map:IEEEpic3,
    transparent:true })
)
scene.add(IEEEphoto3)
IEEEphoto3.position.x=4.005
IEEEphoto3.position.y=1.677
IEEEphoto3.position.z=-5.289


const IEEEphoto4=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(0.34,0.45),
    new THREE.MeshBasicMaterial({map:IEEEpic4,
    transparent:true })
)
scene.add(IEEEphoto4)
IEEEphoto4.position.x=4.466
IEEEphoto4.position.y=0.708
IEEEphoto4.position.z=-5.289



const IEEEOfficers=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1.2,0.5),
    new THREE.MeshBasicMaterial({map:IEEEOfficerspic,
    transparent:true })
)
scene.add(IEEEOfficers)
IEEEOfficers.position.x=3.1
IEEEOfficers.position.y=1.8
IEEEOfficers.position.z=-5.303

const Contactplane=new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1.2,0.5),
    new THREE.MeshBasicMaterial({map:Contactphoto,
    transparent:true })
)
scene.add(Contactplane)
Contactplane.position.x=-1.065
Contactplane.position.y=1.7
Contactplane.position.z=1
Contactplane.rotation.y=1.76

// gui.add(Contactplane.position,'x',-10,10)
// gui.add(Contactplane.position,'y',-10,10)
// gui.add(Contactplane.position,'z',-10,10)
// gui.add(Contactplane.rotation,'x',-10,10)
// gui.add(Contactplane.rotation,'y',-10,10)
// gui.add(Contactplane.rotation,'z',-10,10)



/**
 * Lights
 */
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
// scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(5, 5, 5)
// scene.add(directionalLight)

const pointlight1 = new THREE.PointLight({color:'white'},5)
pointlight1.castShadow = true
scene.add(pointlight1)
pointlight1.position.set(4,3,0)


// const sphereSize = 0.2;
// const pointLightHelper = new THREE.PointLightHelper( pointlight1, sphereSize );
// scene.add( pointLightHelper );

// const pointlight2 = new THREE.PointLight({color:0xffff00},4)
// pointlight2.castShadow = true
// pointlight2.position.set(-1.2,2,2)
// scene.add(pointlight2)

// const sphereSize2 = 0.2;
// const pointLightHelper2 = new THREE.PointLightHelper( pointlight2, sphereSize2);
// scene.add( pointLightHelper2 );
// pointlight1.position.y=3
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.guiwidth / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x=2.5
camera.position.y=0.58
camera.position.z=0.1

scene.add(camera)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0


//html css handling 
const raycaster= new Raycaster()

///clicks 
webplane.name='blb'
const clicklogo = new MouseMeshInteraction(scene,camera)
// My click/nonclick function
clicklogo.addHandler('blb','dblclick', ()=>{
    let logoclick=document.querySelector('.point-0')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-0 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})
// My click/nonclick function for web
ieeeLogo.name='ieeeLogo'
const clicklogo1 = new MouseMeshInteraction(scene,camera)
clicklogo1.addHandler('ieeeLogo','dblclick', ()=>{
    let logoclick=document.querySelector('.point-1')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-1 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})
// My click/nonclick function for hr
hrplane.name='hrplane'
const clicklogohr = new MouseMeshInteraction(scene,camera)
clicklogohr.addHandler('hrplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-2')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-2 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})
// My click/nonclick function for fr
FRplane.name='FRplane'
const clicklogoFR = new MouseMeshInteraction(scene,camera)
clicklogoFR.addHandler('FRplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-3')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-3 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})
// My click/nonclick function for pr
PRplane.name='PRplane'
const clicklogoPR = new MouseMeshInteraction(scene,camera)
clicklogoPR.addHandler('PRplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-4')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-4 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for multimedia
Multimediaplane.name='Multimediaplane'
const clicklogoM = new MouseMeshInteraction(scene,camera)
clicklogoM.addHandler('Multimediaplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-5')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-5 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for Social media
SMMplane.name='SMMplane'
const clicklogoSMM = new MouseMeshInteraction(scene,camera)
clicklogoSMM.addHandler('SMMplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-6')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-6 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for Campus
Campusplane.name='Campusplane'
const clicklogoC = new MouseMeshInteraction(scene,camera)
clicklogoC.addHandler('Campusplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-7')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-7 i')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})
// My click/nonclick function for contact
Contactplane.name='Contactplane'
const clicklogoContact = new MouseMeshInteraction(scene,camera)
clicklogoContact.addHandler('Contactplane','dblclick', ()=>{
    let logoclick=document.querySelector('.point-8')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-8 .exit')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for contact OFFICER
IEEEphoto1.name='IEEEphoto1'
const clicklogoPhoto1 = new MouseMeshInteraction(scene,camera)
clicklogoPhoto1.addHandler('IEEEphoto1','dblclick', ()=>{
    let logoclick=document.querySelector('.point-9')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-9 .exit')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for contact OFFICER
IEEEphoto2.name='IEEEphoto2'
const clicklogoPhoto2 = new MouseMeshInteraction(scene,camera)
clicklogoPhoto2.addHandler('IEEEphoto2','dblclick', ()=>{
    let logoclick=document.querySelector('.point-10')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-10 .exit')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for contact OFFICER
IEEEphoto3.name='IEEEphoto3'
const clicklogoPhoto3 = new MouseMeshInteraction(scene,camera)
clicklogoPhoto3.addHandler('IEEEphoto3','dblclick', ()=>{
    let logoclick=document.querySelector('.point-11')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-11 .exit')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})

// My click/nonclick function for contact OFFICER
IEEEphoto4.name='IEEEphoto4'
const clicklogoPhoto4 = new MouseMeshInteraction(scene,camera)
clicklogoPhoto4.addHandler('IEEEphoto4','dblclick', ()=>{
    let logoclick=document.querySelector('.point-12')
    logoclick.classList.add('vis1')
    let closeLogo = document.querySelector('.point-12 .exit')
closeLogo.addEventListener('click',()=>{
    logoclick.classList.remove('vis1')
})
})



window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

renderer.setClearColor('#191A20')
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()
    //points update
    
    clicklogo.update()
    clicklogo1.update()
    clicklogohr.update()
    clicklogoFR.update()
    clicklogoC.update()
    clicklogoM.update()
    clicklogoSMM.update()
    clicklogoPR.update()
    clicklogoContact.update()
    clicklogoPhoto1.update()
    clicklogoPhoto2.update()
    clicklogoPhoto3.update()
    clicklogoPhoto4.update()
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

