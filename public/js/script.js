// import { escapeHTML } from './helpers.js';


const bars = document.querySelector('#menu-icon');
const container = document.querySelector('.header');
const overlay = document.getElementById('overlay');
const city   = document.getElementById('city');


bars.addEventListener('click', () => {
  container.classList.toggle('active');
  bars.classList.toggle('fa-bars')
  overlay.classList.toggle('active');
  bars.classList.toggle('fa-times');
});

overlay.addEventListener('click', () => {
  container.classList.remove('active');
  bars.classList.toggle('fa-times')
  bars.classList.toggle('fa-bars')
  overlay.classList.remove('active');
});

const submenu = document.getElementById('browse-escorts-submenu');
const trig = document.querySelector('#browse-escorts-trigger');

trig.addEventListener('click', (e)=> {

  e.preventDefault(); // prevent # from jumping to top
  // submenu.classList.toggle('active'); // show/hide submenu 
  submenu.style.display = 'block'
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    submenu.style.display = 'block';
  } else {
    submenu.style.display = 'none';
    submenu.classList.remove('active');
  }
});

document.addEventListener('click', (e) => {
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    if (!trig.contains(e.target) && !submenu.contains(e.target)) {
      submenu.style.display = 'none';
    }
  } else {
    // Desktop: lock submenu open once, only if not already displayed
    if (submenu.style.display !== 'block') {
      submenu.style.display = 'block';
      document.querySelector('#browse-escorts-trigger').innerText = 'Live Calls'
      document.querySelector('#browse-escorts-trigger').href = '/live-calls';
      document.querySelector('#browse-escorts-trigger').style.pointerEvents = 'auto';
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const submenu = document.getElementById('browse-escorts-submenu');
  const isPhone = window.innerWidth < 768;

  if (!isPhone) {
    const trigger = document.querySelector('#browse-escorts-trigger');
    trigger.style.display = 'none';
  }

  const location = {
    Nairobi: ["Kilimani", "Westlands", "Karen", "CBD", "Roysambu", "Ngara", "Nairobi West", "Donholm", "Dandora", "Ojijo", "Yaya", "Sarit", "Ruaka", "Syokimau", "Kitengela", "Embakasi", "South B", "South C", "Lavington", "Parklands"],
    Kiambu: ["Juja", "Kikuyu", "Ruiru", "Githurai", "Thika", "Limuru", "Kabete", "Tigoni"]
  };

  let prefferedOption = localStorage.getItem('prefferedOption')
    ? JSON.parse(localStorage.getItem('prefferedOption'))
    : { city: 'Nairobi', gender: 'Female' };

  let cached = localStorage.getItem('cachedAreaCounts')
    ? JSON.parse(localStorage.getItem('cachedAreaCounts'))
    : null;

  const cacheExpiry = 25 * 60 * 1000;
  let areaData;

  if (cached && (Date.now() - cached.timestamp < cacheExpiry)) {
    areaData = cached.data;
  } else {
    try {
      submenu.innerHTML = '<p>loading areas.</p>';
      const res = await fetch('/areas-with-counts');
      const fresh = await res.json();
      areaData = fresh;
      localStorage.setItem('cachedAreaCounts', JSON.stringify({ data: fresh, timestamp: Date.now() }));
    } catch (err) {
      submenu.innerHTML = '<p>Error loading areas.</p>';
      return;
    }
  }

  if (!areaData || !prefferedOption || !location[prefferedOption.city]) return;

  submenu.innerHTML = '<ul></ul>';
  const ul = submenu.querySelector('ul');
  const areas = areaData[prefferedOption.city];

  areas.forEach(el => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const areaSlug = slugify(el.name, { lower: true });

    a.href = `/escorts-from-${areaSlug}`;
    a.innerText = `${el.name} (${el.count})`;
    a.className = 'area-item';

    if (el.count === 0) {
      a.classList.add('disabled');
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('role', 'menuitem');
      a.style.pointerEvents = 'none';
      a.style.opacity = '0.5';
    }

    li.appendChild(a);
    ul.appendChild(li);
  })
});

