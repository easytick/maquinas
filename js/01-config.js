// ═══════════════════════════════════════════
// FIREBASE CONFIG
// ═══════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyCWDRohBqH0Y6yjIJg99BiTKaziaiF_g60",
      authDomain:        "easytick-maquinas.firebaseapp.com",
      databaseURL:       "https://easytick-maquinas-default-rtdb.firebaseio.com",
      projectId:         "easytick-maquinas",
      storageBucket:     "easytick-maquinas.firebasestorage.app",
      messagingSenderId: "1096291599566",
      appId:             "1:1096291599566:web:6e96b6ebec057fd37afc9f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

let machines = [], financeiro = [], currentUser = null;
var _lastDayResume = null;

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.add('visible');
    var hn=document.getElementById('headerUserName'); if(hn) hn.textContent=user.displayName||user.email;
    var he=document.getElementById('headerUserEmail'); if(he) he.textContent=user.displayName?user.email:'';
    startFirebaseListener();
    startFinanceiroListener();
  } else {
    currentUser = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.remove('visible');
  }
});

function doLogin() {
  var email=document.getElementById('loginEmail').value.trim();
  var pass=document.getElementById('loginPassword').value;
  var btn=document.getElementById('loginBtn'); var err=document.getElementById('loginError');
  if(!email||!pass){alert('Preencha e-mail e senha.');return;}
  btn.textContent='Entrando...'; btn.disabled=true; err.classList.remove('show');
  auth.signInWithEmailAndPassword(email,pass).catch(function(){err.classList.add('show');btn.textContent='Entrar';btn.disabled=false;});
}
function doLogout(){if(confirm('Deseja sair?'))auth.signOut();}
function getCurrentUserName(){return currentUser?(currentUser.displayName||currentUser.email||'Usuario'):'Desconhecido';}
function getCurrentUserEmail(){return currentUser?(currentUser.email||''):'';}

// ═══════════════════════════════════════════
// FIREBASE LISTENERS
// ═══════════════════════════════════════════
function startFirebaseListener() {
  var fbStatus=document.getElementById('fbStatus'); var lb=document.getElementById('loadingBar');
  lb.style.width='60%';
  db.ref('machines').on('value',function(snap){
    lb.style.width='100%'; setTimeout(function(){lb.style.width='0';},400);
    var d=snap.val();
    machines=d?Object.values(d).map(function(m){var nm=Object.assign({history:[],reservations:[],showHistory:false},m);nm.status=normalizeStatus(nm.status);return nm;}):[];
    fbStatus.className='ok'; fbStatus.textContent='Conectado - dados em tempo real';
    setTimeout(function(){fbStatus.className='';},3000);
    render();
  },function(e){fbStatus.className='error';fbStatus.textContent='Erro Firebase: '+e.message;lb.style.width='0';});
}
function startFinanceiroListener() {
  db.ref('financeiro').on('value',function(snap){
    var d=snap.val(); financeiro=d?Object.values(d):[];
    renderDayAlerts();
  });
}
function save() {
  var obj={};
  machines.forEach(function(m){var k=m.serial.replace(/[.#$\/\[\]]/g,'_');obj[k]={serial:m.serial,brand:m.brand,status:normalizeStatus(m.status),history:m.history||[],reservations:m.reservations||[]};});
  db.ref('machines').set(obj);
}
function saveFinanceiro() {
  var obj={};
  financeiro.forEach(function(f){obj[f.id]=f;});
  db.ref('financeiro').set(obj);
}
