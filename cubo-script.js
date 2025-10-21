// Importar Three.js y OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, hypercube, controls;
let raycaster, mouse;
let hoveredFace = null;
let innerCube;
let isOverCenter = false;

// Configuración de zonas con colores específicos
const zones = {
    0: { 
        name: 'Entrada - Zona 0', 
        url: 'habitacion-0.html', 
        desc: 'Copia de la Ciudad',
        color: 0x6B8E23, // Verde bosque/planta
        emissive: 0x556B2F
    },
    1: { 
        name: 'Zona Residencial', 
        url: 'habitacion-2.html', 
        desc: 'Capa Media',
        color: 0x4169E1, // Azul
        emissive: 0x1E3A8A
    },
    2: { 
        name: 'Zona Antinatura', 
        url: 'habitacion-3.html', 
        desc: 'Capa Profunda',
        color: 0x8B008B, // Magenta/Morado oscuro
        emissive: 0x4B0082
    },
    3: { 
        name: 'Zona Protegida', 
        url: 'habitacion-5.html', 
        desc: 'Zona Protegida',
        color: 0xFFFF99, // Amarillo clarito
        emissive: 0xFFD700
    },
    4: { 
        name: 'Zona de Infraestructura', 
        url: 'habitacion-1.html', 
        desc: 'Capa Superficie/Media',
        color: 0x00CED1, // Cyan/Gris azulado
        emissive: 0x008B8B
    },
    5: { 
        name: 'Frontera del Tártaro', 
        url: 'habitacion-4.html', 
        desc: 'Frontera',
        color: 0x8B0A50, // Rojo tirando a morado
        emissive: 0x4B0026
    },
    tartaro: {
        name: 'El Tártaro - Abismo',
        url: 'habitacion-tartaro.html',
        desc: 'Centro de la Dimensión',
        color: 0x1A0000,
        emissive: 0x8B0000
    }
};

// Variables de audio
let audioElement;
let isMusicPlaying = false;

function init() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container not found');
        return;
    }
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D1B2A);
    scene.fog = new THREE.Fog(0x0D1B2A, 10, 50);
    
    // Cámara
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(4, 4, 4);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    
    // Event listeners
    renderer.domElement.addEventListener('click', onHypercubeClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);
    
    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x9C8BA7, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x56C1D3, 0.8, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);
    
    // Crear hipercubo
    createHypercube();
    createParticles();
    
    // Iniciar animación
    animate();
    
    // Ocultar loading
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s';
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }, 100);
}

function createHypercube() {
    hypercube = new THREE.Group();
    hypercube.name = 'hypercube';
    
    // Crear 6 caras como planos transparentes con colores
    const size = 2;
    const positions = [
        { pos: [size, 0, 0], rot: [0, Math.PI/2, 0], zone: 4 },  // Derecha - Infraestructura
        { pos: [-size, 0, 0], rot: [0, -Math.PI/2, 0], zone: 1 }, // Izquierda - Residencial
        { pos: [0, size, 0], rot: [-Math.PI/2, 0, 0], zone: 3 },  // Arriba - Protegida
        { pos: [0, -size, 0], rot: [Math.PI/2, 0, 0], zone: 5 },  // Abajo - Frontera Tártaro
        { pos: [0, 0, size], rot: [0, 0, 0], zone: 0 },           // Frente - Zona 0
        { pos: [0, 0, -size], rot: [0, Math.PI, 0], zone: 2 }     // Atrás - Antinatura
    ];
    
    positions.forEach((config, index) => {
        const geometry = new THREE.PlaneGeometry(size * 1.8, size * 1.8);
        const material = new THREE.MeshStandardMaterial({
            color: zones[config.zone].color,
            emissive: zones[config.zone].emissive,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.3
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(...config.pos);
        plane.rotation.set(...config.rot);
        plane.userData = { 
            zoneIndex: config.zone,
            originalOpacity: 0.3,
            originalEmissive: 0.2
        };
        
        hypercube.add(plane);
        
        // Añadir borde a cada cara
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ 
                color: zones[config.zone].emissive,
                transparent: true,
                opacity: 0.6
            })
        );
        plane.add(line);
    });
    
    // Crear cubo interno (Tártaro) - más pequeño y transparente
    const innerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const innerMaterial = new THREE.MeshStandardMaterial({
        color: zones.tartaro.color,
        emissive: zones.tartaro.emissive,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.4,
        roughness: 0.3,
        metalness: 0.7
    });
    
    innerCube = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCube.userData = { isTartaro: true };
    
    // Añadir borde al cubo interno
    const innerEdges = new THREE.EdgesGeometry(innerGeometry);
    const innerLine = new THREE.LineSegments(
        innerEdges,
        new THREE.LineBasicMaterial({ color: 0xFF0000, opacity: 0.8, transparent: true })
    );
    innerCube.add(innerLine);
    
    hypercube.add(innerCube);
    scene.add(hypercube);
}

function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 300;
    const posArray = new Float32Array(particlesCnt * 3);
    
    for(let i = 0; i < particlesCnt * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.01,
        color: 0x6A8BA8,
        transparent: true,
        opacity: 0.3
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Resetear hover anterior
    if (hoveredFace && hoveredFace !== innerCube) {
        hoveredFace.material.opacity = hoveredFace.userData.originalOpacity;
        hoveredFace.material.emissiveIntensity = hoveredFace.userData.originalEmissive;
    }
    
    // Detectar intersecciones
    const intersects = raycaster.intersectObjects(hypercube.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        if (object.userData.isTartaro) {
            // Hover sobre el Tártaro
            isOverCenter = true;
            innerCube.material.emissiveIntensity = 1.0;
            innerCube.material.opacity = 0.7;
            renderer.domElement.style.cursor = 'pointer';
            
            // Mostrar mensaje
            showMessage('Presiona G para acceder al Tártaro');
        } else if (object.userData.zoneIndex !== undefined) {
            // Hover sobre una cara
            isOverCenter = false;
            hoveredFace = object;
            object.material.opacity = 0.7;
            object.material.emissiveIntensity = 0.6;
            renderer.domElement.style.cursor = 'pointer';
            
            const zone = zones[object.userData.zoneIndex];
            showMessage(`${zone.name} - ${zone.desc}`);
        }
    } else {
        isOverCenter = false;
        hoveredFace = null;
        innerCube.material.emissiveIntensity = 0.5;
        innerCube.material.opacity = 0.4;
        renderer.domElement.style.cursor = 'grab';
        hideMessage();
    }
}

function onHypercubeClick(event) {
    if (hoveredFace && hoveredFace.userData.zoneIndex !== undefined) {
        const zone = zones[hoveredFace.userData.zoneIndex];
        // Mantener la música al navegar
        window.location.href = zone.url;
    }
}

function onKeyDown(event) {
    if (event.key === 'g' || event.key === 'G') {
        if (isOverCenter) {
            // Acceder al Tártaro
            window.location.href = zones.tartaro.url;
        }
    }
}

function showMessage(text) {
    let msg = document.getElementById('zone-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'zone-message';
        msg.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            z-index: 1000;
            border: 2px solid #9C8BA7;
        `;
        document.body.appendChild(msg);
    }
    msg.textContent = text;
    msg.style.display = 'block';
}

function hideMessage() {
    const msg = document.getElementById('zone-message');
    if (msg) {
        msg.style.display = 'none';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotación suave del hipercubo
    if (hypercube) {
        hypercube.rotation.x += 0.002;
        hypercube.rotation.y += 0.003;
    }
    
    // Pulsación del cubo interno
    if (innerCube) {
        const pulse = Math.sin(Date.now() * 0.002) * 0.05 + 1;
        innerCube.scale.set(pulse, pulse, pulse);
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Funciones de música
function toggleMusic() {
    const btn = document.getElementById('musicBtn');
    
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.loop = true;
        audioElement.volume = 0.3;
        
        const source = document.createElement('source');
        source.src = 'still.mp3';
        source.type = 'audio/mpeg';
        audioElement.appendChild(source);
        document.body.appendChild(audioElement);
    }
    
    if (isMusicPlaying) {
        audioElement.pause();
        btn.textContent = '🔇'; // Solo emoji
        isMusicPlaying = false;
    } else {
        audioElement.play().catch(err => console.log('Error:', err));
        btn.textContent = '🔊'; // Solo emoji
        isMusicPlaying = true;
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.toggleMusic = toggleMusic;





