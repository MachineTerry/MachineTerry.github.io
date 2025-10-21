// cubo-script.js - JavaScript del Cubo de Morgana
let scene, camera, renderer, cube, hypercube;
let currentMode = '3d';
let isRotating = true;
let raycaster, mouse;
let controls;

const faceToRoom = {
    0: { name: 'Zona de Infraestructura', url: 'habitacion-1.html', desc: 'Capa Superficie/Media' },
    1: { name: 'Zona Residencial', url: 'habitacion-2.html', desc: 'Capa Media' },
    2: { name: 'Zona Antinatura', url: 'habitacion-3.html', desc: 'Capa Profunda' },
    3: { name: 'Frontera del Tártaro', url: 'habitacion-4.html', desc: 'Tártaro' },
    4: { name: 'Zona Protegida', url: 'habitacion-5.html', desc: 'Templos Iricos' },
    5: { name: 'Entrada - Zona 0', url: 'habitacion-0.html', desc: 'Superficie' }
};

const colors = {
    superficie: 0x9EB3C2,
    media: 0xA796C9,
    profunda: 0x8E7FAF,
    tartaro: 0x56C1D3,
    protegida: 0xA6B59A,
    base: 0x6A8BA8
};

function init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0D1B2A);
    scene.fog = new THREE.Fog(0x0D1B2A, 10, 50);
    
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    renderer.domElement.addEventListener('click', onCubeClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.0/examples/js/controls/OrbitControls.js';
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enabled = true; // desactivado por defecto

    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x9C8BA7, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x56C1D3, 0.8, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);
    
    create3DCube();
    createParticles();
    
    window.addEventListener('resize', onWindowResize);
    animate();
}

function create3DCube() {
    if (cube) scene.remove(cube);
    
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
        new THREE.MeshPhongMaterial({ color: colors.superficie, emissive: colors.superficie, emissiveIntensity: 0.2, shininess: 100 }),
        new THREE.MeshPhongMaterial({ color: colors.media, emissive: colors.media, emissiveIntensity: 0.2, shininess: 100 }),
        new THREE.MeshPhongMaterial({ color: colors.profunda, emissive: colors.profunda, emissiveIntensity: 0.2, shininess: 100 }),
        new THREE.MeshPhongMaterial({ color: colors.tartaro, emissive: colors.tartaro, emissiveIntensity: 0.3, shininess: 100 }),
        new THREE.MeshPhongMaterial({ color: colors.protegida, emissive: colors.protegida, emissiveIntensity: 0.2, shininess: 100 }),
        new THREE.MeshPhongMaterial({ color: colors.base, emissive: colors.base, emissiveIntensity: 0.2, shininess: 100 })
    ];
    
    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9C8BA7, linewidth: 2 }));
    cube.add(line);
}

function create4DHypercube() {
    if (hypercube) scene.remove(hypercube);
    hypercube = new THREE.Group();
    
    const w = 0.7;
    const vertices = [
        [-1,-1,-1,-w],[1,-1,-1,-w],[1,1,-1,-w],[-1,1,-1,-w],
        [-1,-1,1,-w],[1,-1,1,-w],[1,1,1,-w],[-1,1,1,-w],
        [-1,-1,-1,w],[1,-1,-1,w],[1,1,-1,w],[-1,1,-1,w],
        [-1,-1,1,w],[1,-1,1,w],[1,1,1,w],[-1,1,1,w]
    ];
    
    const projected = vertices.map(v => {
        const scale = 3 / (3 - v[3]);
        return new THREE.Vector3(v[0]*scale, v[1]*scale, v[2]*scale);
    });
    
    const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({ 
        color: colors.tartaro, 
        emissive: colors.tartaro, 
        emissiveIntensity: 0.5 
    });
    
    projected.forEach(v => {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(v);
        hypercube.add(sphere);
    });
    
    const edges = [
        [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
        [8,9],[9,10],[10,11],[11,8],[12,13],[13,14],[14,15],[15,12],[8,12],[9,13],[10,14],[11,15],
        [0,8],[1,9],[2,10],[3,11],[4,12],[5,13],[6,14],[7,15]
    ];
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x9C8BA7, 
        opacity: 0.6, 
        transparent: true 
    });
    
    edges.forEach(edge => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            projected[edge[0]], 
            projected[edge[1]]
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        hypercube.add(line);
    });
    
    scene.add(hypercube);
}

function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 800;
    const posArray = new Float32Array(particlesCnt * 3);
    
    for(let i = 0; i < particlesCnt * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x6A8BA8,
        transparent: true,
        opacity: 0.5
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
}

function onMouseMove(event) {
    if (currentMode !== '3d' || !cube) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onCubeClick(event) {
    if (currentMode !== '3d' || !cube) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);
    
    if (intersects.length > 0) {
        const faceIndex = Math.floor(intersects[0].faceIndex / 2);
        selectRoom(faceIndex);
    }
}

function selectRoom(faceIndex) {
    const room = faceToRoom[faceIndex];
    if (room) {
        document.getElementById('selected-room-panel').style.display = 'block';
        document.getElementById('room-name').textContent = `${room.name} — ${room.desc}`;
        document.getElementById('view-room-link').href = room.url;
        
        if (cube && cube.material[faceIndex]) {
            cube.material[faceIndex].emissiveIntensity = 0.6;
            setTimeout(() => {
                if (cube && cube.material[faceIndex]) {
                    cube.material[faceIndex].emissiveIntensity = 0.2;
                }
            }, 400);
        }
    }
}

function setCubeMode(mode) {
    currentMode = mode;
    document.getElementById('btn3d').classList.remove('active');
    document.getElementById('btn4d').classList.remove('active');
    
    if (mode === '3d') {
        if (hypercube) scene.remove(hypercube);
        create3DCube();
        document.getElementById('btn3d').classList.add('active');
        renderer.domElement.style.pointerEvents = 'auto';
    } else {
        if (cube) scene.remove(cube);
        create4DHypercube();
        document.getElementById('btn4d').classList.add('active');
        renderer.domElement.style.pointerEvents = 'none';
        document.getElementById('selected-room-panel').style.display = 'none';
    }
}

function toggleRotation() {
    isRotating = !isRotating;
    const btn = document.getElementById('pauseBtn');
    if (btn) btn.textContent = isRotating ? '⏸️ Pausar' : '▶️ Reanudar';
    controls.enabled = !isRotating; // permitir rotación manual al pausar
}

function animate() {
    requestAnimationFrame(animate);

    if (isRotating) {
        if (cube) {
            cube.rotation.x += 0.005;
            cube.rotation.y += 0.007;
        }
        if (hypercube) {
            hypercube.rotation.x += 0.003;
            hypercube.rotation.y += 0.005;
            hypercube.rotation.z += 0.002;
        }
    }

    // Siempre actualizar controles, así damping funciona incluso si no está pausado
    if (controls) controls.update();

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();

}



