// Importar Three.js y OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, hypercube, controls;
let raycaster, mouse;
let hoveredFace = null;
let innerCube, outerCube;
let isOverCenter = false;
let trapezoidMeshes = [];

// Configuración de zonas con colores específicos
const zones = {
    0: { 
        name: 'Entrada - Zona 0', 
        url: 'habitacion-0.html', 
        desc: 'Copia de la Ciudad',
        color: 0x6B8E23,
        emissive: 0x556B2F
    },
    1: { 
        name: 'Zona Residencial', 
        url: 'habitacion-2.html', 
        desc: 'Capa Media',
        color: 0x4169E1,
        emissive: 0x1E3A8A
    },
    2: { 
        name: 'Zona Antinatura', 
        url: 'habitacion-3.html', 
        desc: 'Capa Profunda',
        color: 0x8B008B,
        emissive: 0x4B0082
    },
    3: { 
        name: 'Zona Protegida', 
        url: 'habitacion-5.html', 
        desc: 'Zona Protegida',
        color: 0xFFFF99,
        emissive: 0xFFD700
    },
    4: { 
        name: 'Zona de Infraestructura', 
        url: 'habitacion-1.html', 
        desc: 'Capa Superficie/Media',
        color: 0x00CED1,
        emissive: 0x008B8B
    },
    5: { 
        name: 'Frontera del Tártaro', 
        url: 'habitacion-4.html', 
        desc: 'Frontera',
        color: 0x8B0A50,
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
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D1B2A);
    scene.fog = new THREE.Fog(0x0D1B2A, 10, 50);
    
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 4, 5);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 15;
    
    renderer.domElement.addEventListener('click', onHypercubeClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x9C8BA7, 1.2, 100);
    pointLight1.position.set(6, 6, 6);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x56C1D3, 0.8, 100);
    pointLight2.position.set(-6, -6, 6);
    scene.add(pointLight2);
    
    createHypercube();
    createParticles();
    animate();
    
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
    trapezoidMeshes = [];
    
    // Definir vértices del hipercubo en 4D
    const w = 0.5; // Cuarta dimensión
    const vertices4D = [
        // Cubo exterior (w = -0.5)
        [-1,-1,-1,-w], [1,-1,-1,-w], [1,1,-1,-w], [-1,1,-1,-w],
        [-1,-1,1,-w], [1,-1,1,-w], [1,1,1,-w], [-1,1,1,-w],
        // Cubo interior (w = 0.5)
        [-1,-1,-1,w], [1,-1,-1,w], [1,1,-1,w], [-1,1,-1,w],
        [-1,-1,1,w], [1,-1,1,w], [1,1,1,w], [-1,1,1,w]
    ];
    
    // Proyección estereográfica de 4D a 3D
    const projected = vertices4D.map(v => {
        const distance = 4;
        const scale = distance / (distance - v[3]);
        return new THREE.Vector3(v[0] * scale * 1.5, v[1] * scale * 1.5, v[2] * scale * 1.5);
    });
    
    // Crear cubo interno (Tártaro) - índices 8-15
    const innerVertices = projected.slice(8, 16);
    innerCube = createCubeFromVertices(innerVertices, zones.tartaro, true);
    innerCube.userData = { isTartaro: true };
    hypercube.add(innerCube);
    
    // Crear cubo externo transparente - índices 0-7
    const outerVertices = projected.slice(0, 8);
    outerCube = createCubeWireframe(outerVertices);
    hypercube.add(outerCube);
    
    // Crear caras trapezoidales (conectan cubo interno con externo)
    const trapezoidFaces = [
        { outer: [0,1,2,3], inner: [8,9,10,11], zone: 0 },   // Frente
        { outer: [4,5,6,7], inner: [12,13,14,15], zone: 2 }, // Atrás
        { outer: [0,1,5,4], inner: [8,9,13,12], zone: 5 },   // Abajo
        { outer: [2,3,7,6], inner: [10,11,15,14], zone: 3 }, // Arriba
        { outer: [0,3,7,4], inner: [8,11,15,12], zone: 1 },  // Izquierda
        { outer: [1,2,6,5], inner: [9,10,14,13], zone: 4 }   // Derecha
    ];
    
    trapezoidFaces.forEach((face, idx) => {
        const trapezoid = createTrapezoid(
            projected[face.outer[0]], projected[face.outer[1]], 
            projected[face.outer[2]], projected[face.outer[3]],
            projected[face.inner[0]], projected[face.inner[1]], 
            projected[face.inner[2]], projected[face.inner[3]],
            zones[face.zone]
        );
        trapezoid.userData = { 
            zoneIndex: face.zone,
            isTrapezoid: true,
            originalOpacity: 0.25,
            originalEmissive: 0.2
        };
        trapezoidMeshes.push(trapezoid);
        hypercube.add(trapezoid);
    });
    
    scene.add(hypercube);
}

function createTrapezoid(o1, o2, o3, o4, i1, i2, i3, i4, zone) {
    const geometry = new THREE.BufferGeometry();
    
    // Crear dos triángulos para cada lado del trapecio
    const positions = new Float32Array([
        // Primer triángulo
        o1.x, o1.y, o1.z,
        o2.x, o2.y, o2.z,
        i1.x, i1.y, i1.z,
        // Segundo triángulo
        o2.x, o2.y, o2.z,
        i2.x, i2.y, i2.z,
        i1.x, i1.y, i1.z,
        // Tercer triángulo
        o2.x, o2.y, o2.z,
        o3.x, o3.y, o3.z,
        i2.x, i2.y, i2.z,
        // Cuarto triángulo
        o3.x, o3.y, o3.z,
        i3.x, i3.y, i3.z,
        i2.x, i2.y, i2.z,
        // Quinto triángulo
        o3.x, o3.y, o3.z,
        o4.x, o4.y, o4.z,
        i3.x, i3.y, i3.z,
        // Sexto triángulo
        o4.x, o4.y, o4.z,
        i4.x, i4.y, i4.z,
        i3.x, i3.y, i3.z,
        // Séptimo triángulo
        o4.x, o4.y, o4.z,
        o1.x, o1.y, o1.z,
        i4.x, i4.y, i4.z,
        // Octavo triángulo
        o1.x, o1.y, o1.z,
        i1.x, i1.y, i1.z,
        i4.x, i4.y, i4.z
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        color: zone.color,
        emissive: zone.emissive,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Añadir bordes
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ 
            color: zone.emissive,
            transparent: true,
            opacity: 0.4
        })
    );
    mesh.add(line);
    
    return mesh;
}

function createCubeFromVertices(vertices, zone, isInner) {
    const geometry = new THREE.BufferGeometry();
    
    const indices = [
        0,1,2, 0,2,3, // Frente
        4,5,6, 4,6,7, // Atrás
        0,1,5, 0,5,4, // Abajo
        2,3,7, 2,7,6, // Arriba
        0,3,7, 0,7,4, // Izquierda
        1,2,6, 1,6,5  // Derecha
    ];
    
    const positions = [];
    vertices.forEach(v => positions.push(v.x, v.y, v.z));
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        color: zone.color,
        emissive: zone.emissive,
        emissiveIntensity: isInner ? 0.5 : 0.1,
        transparent: true,
        opacity: isInner ? 0.4 : 0.15,
        roughness: 0.3,
        metalness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ 
            color: isInner ? 0xFF0000 : 0x9C8BA7,
            opacity: isInner ? 0.8 : 0.3,
            transparent: true
        })
    );
    mesh.add(line);
    
    return mesh;
}

function createCubeWireframe(vertices) {
    const group = new THREE.Group();
    
    const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
    ];
    
    edges.forEach(edge => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            vertices[edge[0]], vertices[edge[1]]
        ]);
        const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ 
                color: 0x9C8BA7,
                opacity: 0.3,
                transparent: true
            })
        );
        group.add(line);
    });
    
    return group;
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
    if (hoveredFace && hoveredFace.userData.isTrapezoid) {
        hoveredFace.material.opacity = hoveredFace.userData.originalOpacity;
        hoveredFace.material.emissiveIntensity = hoveredFace.userData.originalEmissive;
    }
    
    // Resetear cubo interno
    if (innerCube && !isOverCenter) {
        innerCube.material.emissiveIntensity = 0.5;
        innerCube.material.opacity = 0.4;
    }
    
    const intersects = raycaster.intersectObjects([innerCube, ...trapezoidMeshes], false);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        if (object.userData.isTartaro) {
            isOverCenter = true;
            innerCube.material.emissiveIntensity = 1.2;
            innerCube.material.opacity = 0.8;
            renderer.domElement.style.cursor = 'pointer';
            showMessage('Presiona G para acceder al Tártaro');
        } else if (object.userData.isTrapezoid) {
            isOverCenter = false;
            hoveredFace = object;
            object.material.opacity = 0.7;
            object.material.emissiveIntensity = 0.8;
            renderer.domElement.style.cursor = 'pointer';
            
            const zone = zones[object.userData.zoneIndex];
            showMessage(`${zone.name} - ${zone.desc}`);
        }
    } else {
        isOverCenter = false;
        hoveredFace = null;
        renderer.domElement.style.cursor = 'grab';
        hideMessage();
    }
}

function onHypercubeClick(event) {
    if (hoveredFace && hoveredFace.userData.isTrapezoid) {
        const zone = zones[hoveredFace.userData.zoneIndex];
        window.location.href = zone.url;
    }
}

function onKeyDown(event) {
    if (event.key === 'g' || event.key === 'G') {
        if (isOverCenter) {
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
    if (msg) msg.style.display = 'none';
}

function animate() {
    requestAnimationFrame(animate);
    
    if (hypercube) {
        hypercube.rotation.x += 0.002;
        hypercube.rotation.y += 0.003;
    }
    
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

function toggleMusic() {
    const btn = document.getElementById('musicBtn');
    
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.loop = true;
        audioElement.volume = 0.8;
        
        const source = document.createElement('source');
        source.src = 'still.mp3';
        source.type = 'audio/mpeg';
        audioElement.appendChild(source);
        document.body.appendChild(audioElement);
    }
    
    if (isMusicPlaying) {
        audioElement.pause();
        btn.textContent = '🔇';
        isMusicPlaying = false;
    } else {
        audioElement.play().catch(err => console.log('Error:', err));
        btn.textContent = '🔊';
        isMusicPlaying = true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.toggleMusic = toggleMusic;






