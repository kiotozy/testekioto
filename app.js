import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer, mixer, model, clock;
let currentAction = null;

initScene();
loadModel();
setupVoiceCommands();

document.getElementById('ar-button').addEventListener('click', () => {
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(render);
});

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.xr.enabled = false;
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  clock = new THREE.Clock();

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 1.6, 2);
  controls.update();
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.load('kioto.glb', (gltf) => {
    model = gltf.scene;
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    if (gltf.animations.length > 0) {
      currentAction = mixer.clipAction(gltf.animations[0]);
      currentAction.play();
    }
  });
}

function playAnimation(play = true) {
  if (!currentAction) return;
  if (play) {
    currentAction.play();
  } else {
    currentAction.stop();
  }
}

function render(timestamp, frame) {
  if (mixer) mixer.update(clock.getDelta());
  renderer.render(scene, camera);
}

function setupVoiceCommands() {
  const micButton = document.getElementById('mic-button');
  micButton.addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      handleCommand(transcript);
    };

    recognition.start();
  });
}

function handleCommand(text) {
  console.log('Comando reconhecido:', text);

  const audioMap = {
    'olá': 'ola.mp3',
    'bom dia': 'bom_dia.mp3',
    'boa tarde': 'boa_tarde.mp3',
    'boa noite': 'boa_noite.mp3',
    'qual seu nome': 'qual_seu_nome.mp3',
    'quer ser meu amigo': 'quer_ser_meu_amigo.mp3',
    'comandos': 'comandos.mp3',
    'não entendi': 'nao_entendi.mp3',
  };

  if (text in audioMap) {
    const audio = new Audio(audioMap[text]);
    audio.play();
  } else if (text.includes('dançar')) {
    playAnimation(true);
  } else if (text.includes('parar')) {
    playAnimation(false);
  } else {
    const audio = new Audio('nao_entendi.mp3');
    audio.play();
  }
}
