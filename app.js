import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, mixer, model, clock;
let currentAction = null;

initScene();
loadModel();
setupVoiceRecognition();

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  camera.position.set(0, 1.6, 2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  light.position.set(0, 1, 0);
  scene.add(light);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();

  animate();
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.load('kioto.glb', (gltf) => {
    model = gltf.scene;
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    if (gltf.animations.length > 0) {
      currentAction = mixer.clipAction(gltf.animations[0]);
      currentAction.play();
    }
  }, undefined, (error) => {
    console.error('Erro ao carregar o modelo:', error);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

document.getElementById('ar-button').addEventListener('click', () => {
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
  });
});

function setupVoiceRecognition() {
  const micButton = document.getElementById('mic-button');
  micButton.addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase().trim();
      handleVoiceCommand(text);
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error);
    };

    recognition.start();
  });
}

function handleVoiceCommand(text) {
  const audioMap = {
    'olá': 'ola.mp3',
    'bom dia': 'bom_dia.mp3'
  };

  if (text in audioMap) {
    new Audio(audioMap[text]).play();
  } else if (text.includes('dançar')) {
    if (currentAction) currentAction.play();
  } else if (text.includes('parar')) {
    if (currentAction) currentAction.stop();
  } else {
    new Audio('ola.mp3').play();
  }
}
