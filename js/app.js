// ===== ORBIT CONFIG =====
const orbits = {
  mercury: { radius: 4,    speed: 0.020, angle: 0 },
  venus:   { radius: 7,    speed: 0.015, angle: 1.0 },
  earth:   { radius: 10,   speed: 0.010, angle: 2.0 },
  mars:    { radius: 13,   speed: 0.008, angle: 3.5 },
  jupiter: { radius: 17,   speed: 0.004, angle: 0.5 },
  saturn:  { radius: 21.5, speed: 0.003, angle: 1.8 },
  uranus:  { radius: 25.5, speed: 0.002, angle: 4.2 },
  neptune: { radius: 29,   speed: 0.001, angle: 5.0 }
};

const spinSpeeds = {
  sun: 0.003, mercury: 0.002, venus: 0.001, earth: 0.008,
  mars: 0.007, jupiter: 0.015, saturn: 0.012, uranus: 0.005, neptune: 0.006
};
const spinAngles = { sun: 0, mercury: 0, venus: 0, earth: 0, mars: 0, jupiter: 0, saturn: 0, uranus: 0, neptune: 0 };

let animPaused = false;

// ===== ANIMATION LOOP =====
function animate() {
  if (!animPaused) {
    for (const [name, o] of Object.entries(orbits)) {
      o.angle += o.speed;
      const x = Math.cos(o.angle) * o.radius;
      const z = Math.sin(o.angle) * o.radius;
      const el = document.getElementById(name);
      if (el) el.setAttribute('translation', `${x.toFixed(3)} 0 ${z.toFixed(3)}`);
    }
    for (const [name, speed] of Object.entries(spinSpeeds)) {
      spinAngles[name] += speed;
      const el = document.getElementById(name);
      if (el) el.setAttribute('rotation', `0 1 0 ${spinAngles[name].toFixed(3)}`);
    }
  }
  requestAnimationFrame(animate);
}

window.addEventListener('load', () => {
  animate();
  loadAllPlanets(); // pre-load all planet data from PHP on startup
});

// ===== AJAX: Load planet data from PHP =====
let planetCache = {}; // store loaded data so we don't re-fetch

function loadAllPlanets() {
  fetch('php/planets.php')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        data.planets.forEach(p => {
          planetCache[p.key_name] = p;
        });
        console.log('Planet data loaded from database:', Object.keys(planetCache).length, 'planets');
      }
    })
    .catch(err => {
      console.warn('PHP/AJAX not available, using fallback data.', err);
      loadFallbackData();
    });
}

function loadFallbackData() {
  // Fallback if PHP server not running
  planetCache = {
    sun:     { name:'Sun',     emoji:'☀️', description:'The star at the centre of our Solar System.', type:'Star',        diameter:'1,390,000 km', moons:'0',   orbit:'N/A',           temperature:'5,500°C'  },
    mercury: { name:'Mercury', emoji:'☿',  description:'Smallest planet, closest to the Sun.',        type:'Terrestrial', diameter:'4,879 km',     moons:'0',   orbit:'88 Earth days', temperature:'167°C avg'},
    venus:   { name:'Venus',   emoji:'♀',  description:'Hottest planet due to greenhouse effect.',    type:'Terrestrial', diameter:'12,104 km',    moons:'0',   orbit:'225 days',      temperature:'465°C'    },
    earth:   { name:'Earth',   emoji:'🌍', description:'Our home. Only known planet with life.',       type:'Terrestrial', diameter:'12,742 km',    moons:'1',   orbit:'365.25 days',   temperature:'15°C avg' },
    mars:    { name:'Mars',    emoji:'♂',  description:'The Red Planet. Home to Olympus Mons.',       type:'Terrestrial', diameter:'6,779 km',     moons:'2',   orbit:'687 Earth days',temperature:'-60°C avg'},
    jupiter: { name:'Jupiter', emoji:'♃',  description:'Largest planet with the Great Red Spot.',     type:'Gas Giant',   diameter:'139,820 km',   moons:'95',  orbit:'12 Earth years',temperature:'-110°C'   },
    saturn:  { name:'Saturn',  emoji:'♄',  description:'Famous for its stunning ring system.',        type:'Gas Giant',   diameter:'116,460 km',   moons:'146', orbit:'29 Earth years',temperature:'-140°C'   },
    uranus:  { name:'Uranus',  emoji:'⛢',  description:'Ice giant that rotates on its side.',         type:'Ice Giant',   diameter:'50,724 km',    moons:'27',  orbit:'84 Earth years',temperature:'-195°C'   },
    neptune: { name:'Neptune', emoji:'♆',  description:'Farthest planet. Winds up to 2,100 km/h.',   type:'Ice Giant',   diameter:'49,244 km',    moons:'16',  orbit:'165 Earth years',temperature:'-200°C'   }
  };
}

// ===== FOCUS ON PLANET (uses cached AJAX data) =====
function focusPlanet(name) {
  // Show loading state
  document.getElementById('planetName').textContent = 'Loading...';
  document.getElementById('planetDesc').textContent = '';
  document.getElementById('planetFacts').innerHTML = '';

  // Highlight button
  document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  // Use cached data if available, otherwise fetch individually
  if (planetCache[name]) {
    displayPlanetInfo(planetCache[name]);
  } else {
    fetch(`php/planets.php?planet=${name}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          planetCache[name] = data.planet;
          displayPlanetInfo(data.planet);
        }
      })
      .catch(() => {
        loadFallbackData();
        displayPlanetInfo(planetCache[name]);
      });
  }

  // Move camera to planet
  const el = document.getElementById(name);
  const cam = document.getElementById('mainCam');
  if (el && cam) {
    const t = el.getAttribute('translation') || '0 0 0';
    const parts = t.split(' ').map(Number);
    const px = parts[0] || 0;
    const pz = parts[2] || 0;
    const dist = name === 'sun' ? 8 : 5;
    cam.setAttribute('position', `${px} 3 ${pz + dist}`);
    cam.setAttribute('centerOfRotation', `${px} 0 ${pz}`);
    cam.setAttribute('orientation', '1 0 0 -0.3');
  }
}

function displayPlanetInfo(p) {
  document.getElementById('planetName').textContent = `${p.emoji || ''} ${p.name}`;
  document.getElementById('planetDesc').textContent = p.description;
  const facts = document.getElementById('planetFacts');
  facts.innerHTML = '';
  const items = [
    `Type: ${p.type}`,
    `Diameter: ${p.diameter}`,
    `Moons: ${p.moons}`,
    `Orbit: ${p.orbit}`,
    `Temperature: ${p.temperature}`
  ];
  items.forEach(f => {
    const li = document.createElement('li');
    li.textContent = f;
    facts.appendChild(li);
  });
}

// ===== RESET CAMERA =====
function resetCamera() {
  const cam = document.getElementById('mainCam');
  if (cam) {
    cam.setAttribute('position', '0 8 45');
    cam.setAttribute('orientation', '1 0 0 -0.17');
    cam.setAttribute('centerOfRotation', '0 0 0');
  }
  document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
}

// ===== WIREFRAME =====
let wireOn = false;
function toggleWireframe() {
  wireOn = !wireOn;
  document.querySelectorAll('shape').forEach(shape => {
    let fp = shape.querySelector('fillproperties');
    if (wireOn) {
      if (!fp) { fp = document.createElement('fillproperties'); shape.appendChild(fp); }
      fp.setAttribute('filled', 'false');
      fp.setAttribute('hatched', 'false');
    } else {
      if (fp) fp.remove();
    }
  });
}

// ===== PAUSE / PLAY =====
function toggleAnimation() {
  animPaused = !animPaused;
  event.target.textContent = animPaused ? '▶ Play' : '⏸ Pause/Play';
}

// ===== AUDIO =====
function playSpaceSound() {
  document.getElementById('spaceAudio').play().catch(() => {
    alert('Add an mp3 at: audio/space.mp3');
  });
}
function stopSpaceSound() {
  const a = document.getElementById('spaceAudio');
  a.pause();
  a.currentTime = 0;
}
