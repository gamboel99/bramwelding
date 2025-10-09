/* App JS: Firebase-backed product gallery + simulator + simple WA consult link.
   IMPORTANT: Rename firebase-config.example.js => firebase-config.js and fill your config.
*/
const galleryEl = document.getElementById('gallery');
const productForm = document.getElementById('product-form');
const simForm = document.getElementById('sim-form');
const simResult = document.getElementById('sim-result');
const simTable = document.getElementById('sim-table');
const consultForm = document.getElementById('consult-form');

// Default unit prices (used when user doesn't input custom price)
const defaultPrices = {
  las_pagar: 150000,
  pintu_harmonika: 1250000,
  atap_baja: 175000,
  pintu_galvalum: 900000
};

// ---------- Firebase init (if available) ----------
let firebaseAvailable = false;
try {
  if (typeof firebaseConfig !== 'undefined') {
    // Initialize firebase app
    firebase.initializeApp(firebaseConfig);
    const storage = firebase.storage();
    const db = firebase.firestore();
    firebaseAvailable = true;

    // Load existing products
    db.collection('products').orderBy('createdAt','desc').limit(200).onSnapshot(snap => {
      galleryEl.innerHTML='';
      snap.forEach(doc => {
        const d = doc.data();
        const el = createProductCard(d.name, d.category, d.imageUrl);
        galleryEl.appendChild(el);
      });
    });

    // Handle upload form
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('p-name').value.trim();
      const cat = document.getElementById('p-cat').value;
      const file = document.getElementById('p-file').files[0];
      if (!file) return alert('Pilih file gambar.');
      const id = 'prod_' + Date.now();
      const ref = storage.ref().child('products/' + id + '_' + file.name);
      const task = ref.put(file);
      task.on('state_changed', ()=>{}, console.error, async ()=>{
        const url = await ref.getDownloadURL();
        await db.collection('products').add({ name, category:cat, imageUrl:url, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        productForm.reset();
      });
    });

  }
} catch(err){
  console.warn('Firebase not configured. Using local dummy gallery. Error:', err);
  firebaseAvailable = false;
}

// If no firebase: load local dummy images shipped with site
const dummyProducts = [
  {name:'Las Pagar - Model A', category:'Las Pagar', imageUrl:'assets/images/las_pagar.svg'},
  {name:'Pintu Harmonika - H1', category:'Pintu Harmonika', imageUrl:'assets/images/pintu_harmonika.svg'},
  {name:'Atap Baja Ringan - 1', category:'Atap Baja Ringan', imageUrl:'assets/images/atap_baja.svg'},
  {name:'Pagar Minimalis', category:'Pagar', imageUrl:'assets/images/pagar.svg'},
  {name:'Pintu Galvalum', category:'Pintu & Jendela Galvalum', imageUrl:'assets/images/pintu_galvalum.svg'}
];

if (!firebaseAvailable){
  galleryEl.innerHTML='';
  dummyProducts.forEach(p => galleryEl.appendChild(createProductCard(p.name,p.category,p.imageUrl)));
}

// helper to create card
function createProductCard(name, cat, url){
  const wrap = document.createElement('div');
  wrap.className = 'card-item';
  const img = document.createElement('img'); img.src = url; img.alt = name;
  const h = document.createElement('h4'); h.textContent = name;
  const c = document.createElement('div'); c.className='small'; c.textContent = cat;
  wrap.appendChild(img); wrap.appendChild(h); wrap.appendChild(c);
  return wrap;
}

// ---------- Simulator ----------
simForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const type = document.getElementById('s-type').value;
  const qty = Number(document.getElementById('s-qty').value) || 1;
  const priceInput = Number(document.getElementById('s-price').value);
  const unitPrice = priceInput > 0 ? priceInput : defaultPrices[type] || 100000;
  // Simple breakdown: Bahan = 60% dari unitPrice, Tenaga = 30%, Lain-lain = 10%
  const bahanPer = unitPrice * 0.6;
  const tenagaPer = unitPrice * 0.3;
  const lainPer = unitPrice * 0.1;
  const bahanTotal = Math.round(bahanPer * qty);
  const tenagaTotal = Math.round(tenagaPer * qty);
  const lainTotal = Math.round(lainPer * qty);
  const subtotal = Math.round(unitPrice * qty);
  const total = subtotal; // no tax added, but could be extended

  simTable.innerHTML = `
    <tr><td>Jenis</td><td>${document.querySelector('#s-type option:checked').textContent}</td></tr>
    <tr><td>Jumlah / Panjang</td><td>${qty}</td></tr>
    <tr><td>Harga Satuan</td><td>Rp ${unitPrice.toLocaleString()}</td></tr>
    <tr><td>Biaya Bahan</td><td>Rp ${bahanTotal.toLocaleString()}</td></tr>
    <tr><td>Biaya Tenaga</td><td>Rp ${tenagaTotal.toLocaleString()}</td></tr>
    <tr><td>Biaya Lain-lain</td><td>Rp ${lainTotal.toLocaleString()}</td></tr>
    <tr><td><strong>Total Estimasi</strong></td><td><strong>Rp ${total.toLocaleString()}</strong></td></tr>
  `;
  simResult.hidden = false;
});

// ---------- Consult form => opens WhatsApp with message ----------
consultForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = document.getElementById('c-name').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const msg = document.getElementById('c-msg').value.trim();
  const to = '62895702042736'; // owner number in E.164 without leading zero
  const text = encodeURIComponent(`Halo Bram Welding, saya ${name} (${phone}). ${msg}`);
  window.open(`https://wa.me/${to}?text=${text}`,'_blank');
});

// If Firebase not present, product upload will warn user.
productForm.addEventListener('submit',(e)=>{
  if (!firebaseAvailable){
    e.preventDefault();
    alert('Fitur upload produk memerlukan Firebase. Lihat README dan isi firebase-config.js');
  }
});
