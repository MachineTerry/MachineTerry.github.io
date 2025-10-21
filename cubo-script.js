// cubo-script.js
export function initCube(THREE, OrbitControls) {
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

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enabled = false; // empieza rotando automáticamente

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x9C8BA7, 1, 100);
    pointLight1.position.set(5,5,5); scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x56C1D3, 0.8, 100);
    pointLight2.position.set(-5,-5,5); scene.add(pointLight2);

    create3DCube();
    createParticles();

    window.addEventListener('resize', onWindowResize);
    document.getElementById('pauseBtn').addEventListener('click', toggleRotation);

    animate();
  }

  function create3DCube() {
    if(cube) scene.remove(cube);
    const geometry = new THREE.BoxGeometry(2,2,2);
    const materials = [
      new THREE.MeshPhongMaterial({ color: colors.superficie, emissive: colors.superficie, emissiveIntensity:0.2 }),
      new THREE.MeshPhongMaterial({ color: colors.media, emissive: colors.media, emissiveIntensity:0.2 }),
      new THREE.MeshPhongMaterial({ color: colors.profunda, emissive: colors.profunda, emissiveIntensity:0.2 }),
      new THREE.MeshPhongMaterial({ color: colors.tartaro, emissive: colors.tartaro, emissiveIntensity:0.3 }),
      new THREE.MeshPhongMaterial({ color: colors.protegida, emissive: colors.protegida, emissiveIntensity:0.2 }),
      new THREE.MeshPhongMaterial({ color: colors.base, emissive: colors.base, emissiveIntensity:0.2 })
    ];
    cube = new THREE.Mesh(geometry, materials);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9C8BA7 }));
    cube.add(line);
    scene.add(cube);
  }

  function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 800;
    const pos = new Float32Array(count*3);
    for(let i=0;i<count*3;i++) pos[i]=(Math.random()-0.5)*50;
    geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const material = new THREE.PointsMaterial({size:0.03,color:0x6A8BA8,opacity:0.5,transparent:true});
    scene.add(new THREE.Points(geometry,material));
  }

  function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left)/rect.width)*2-1;
    mouse.y = -((event.clientY - rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const intersects = raycaster.intersectObject(cube);
    renderer.domElement.style.cursor = intersects.length>0?'pointer':'default';
  }

  function onCubeClick() {
    raycaster.setFromCamera(mouse,camera);
    const intersects = raycaster.intersectObject(cube);
    if(intersects.length>0){
      const faceIndex = Math.floor(intersects[0].faceIndex/2);
      const room = faceToRoom[faceIndex];
      if(room){
        const panel=document.getElementById('selected-room-panel');
        panel.style.display='block';
        document.getElementById('room-name').textContent = `${room.name} — ${room.desc}`;
        document.getElementById('view-room-link').href = room.url;
      }
    }
  }

  function toggleRotation(){
    isRotating=!isRotating;
    controls.enabled=!isRotating;
    const btn=document.getElementById('pauseBtn');
    btn.textContent = isRotating ? '⏸️ Pausar':'▶️ Reanudar';
  }

  function animate(){
    requestAnimationFrame(animate);
    if(isRotating){
      if(cube){ cube.rotation.x+=0.005; cube.rotation.y+=0.007; }
    }
    if(controls) controls.update();
    renderer.render(scene,camera);
  }

  function onWindowResize(){
    const container=document.getElementById('canvas-container');
    camera.aspect=container.clientWidth/container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth,container.clientHeight);
  }

  init();
}




