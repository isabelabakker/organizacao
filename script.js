// ---------------- Navegação ----------------
function showSection(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("header button").forEach(b=>b.classList.remove("active"));
  document.querySelector(`header button[onclick*="${id}"]`).classList.add("active");
}

// ---------------- Planner ----------------
const today = new Date();
const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
let tasks = JSON.parse(localStorage.getItem("tasks"))||{};
let plannerCurrentMonth = today.getMonth();
const calendar = document.getElementById("calendar");

const plannerMonthTabs = document.getElementById("plannerMonthTabs");
months.forEach((m,i)=>{
  const btn = document.createElement("button");
  btn.textContent=m;
  if(i===plannerCurrentMonth) btn.classList.add("active");
  btn.onclick=()=>{plannerCurrentMonth=i; renderCalendar(i); document.querySelectorAll('#plannerMonthTabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');};
  plannerMonthTabs.appendChild(btn);
});

function renderCalendar(month){
  calendar.innerHTML="";
  const year=today.getFullYear();
  const daysInMonth=new Date(year,month+1,0).getDate();
  for(let i=1;i<=daysInMonth;i++){
    const day=document.createElement("div");
    day.classList.add("day");
    day.textContent=i;
    day.onclick=()=>openModal(i);
    calendar.appendChild(day);
  }
  aplicarCores();
}
renderCalendar(plannerCurrentMonth);

let currentDay=null;
function openModal(day){
  currentDay=plannerCurrentMonth+'-'+day;
  document.getElementById("taskTitle").textContent=`Dia ${day}`;
  renderTasks();
  document.getElementById("taskModal").style.display="flex";
}
function closeModal(){document.getElementById("taskModal").style.display="none";}
function addTask(){
  const input=document.getElementById("newTaskInput");
  const timeInput=document.getElementById("taskTime");
  const t=input.value.trim();
  const h=timeInput.value;
  if(t && h){
    if(!tasks[currentDay]) tasks[currentDay]=[];
    tasks[currentDay].push({hora:h, desc:t});
    tasks[currentDay].sort((a,b)=>a.hora.localeCompare(b.hora));
    localStorage.setItem("tasks", JSON.stringify(tasks));
    input.value=""; timeInput.value="";
    renderTasks();
  }
}
function renderTasks(){
  const list=document.getElementById("taskList"); 
  list.innerHTML="";
  if(tasks[currentDay]){
    tasks[currentDay].forEach((t,i)=>{
      const li=document.createElement("li");
      li.textContent=`[${t.hora}] ${t.desc}`;
      const btn = document.createElement("button");
      btn.textContent="✖";
      btn.classList.add("task-remove-btn");
      btn.onclick=()=>{tasks[currentDay].splice(i,1); localStorage.setItem("tasks",JSON.stringify(tasks)); renderTasks();};
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
}

// ---------------- Financeiro ----------------
const financeForm=document.getElementById("financeForm");
const financeTable=document.getElementById("financeTable");
const saldoSpan=document.getElementById("saldo");
let saldo=parseFloat(localStorage.getItem("saldo"))||0;
let registros=JSON.parse(localStorage.getItem("registros"))||[];
let categorias=JSON.parse(localStorage.getItem("categorias"))||["Alimentação","Transporte","Lazer","Saúde","Educação","Outros"];
let despesaChart;
const categoriaSelect=document.getElementById("categoria");
let categoriaColors=JSON.parse(localStorage.getItem("categoriaColors")) || ["#fcbad3","#e0d4f7","#ffd6e8","#ffa6c1","#f7d4f0","#d4a5f7","#ffb3d9","#ffcce7","#f7c6d9","#e8b0f7"];

function atualizarCategoriaSelects(){
  categoriaSelect.innerHTML='<option value="">Categoria (opcional)</option>';
  categorias.forEach(cat=>{
    const opt=document.createElement("option"); opt.value=cat; opt.textContent=cat; categoriaSelect.appendChild(opt);
  });
  localStorage.setItem("categorias", JSON.stringify(categorias));
  localStorage.setItem("categoriaColors", JSON.stringify(categoriaColors));
}
atualizarCategoriaSelects();

function addCategory(){
  const newCat=document.getElementById("newCategory").value.trim();
  if(newCat && !categorias.includes(newCat)){
    categorias.push(newCat);
    categoriaColors.push(getRandomPastelColor());
    atualizarCategoriaSelects();
    document.getElementById("newCategory").value='';
    atualizarFinanceiro();
  }
}

function getRandomPastelColor(){ const hue=Math.floor(Math.random()*360); return `hsl(${hue},70%,85%)`; }

function atualizarFinanceiro(){
  financeTable.innerHTML="";
  const catDespesa={};
  registros.forEach((r,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.desc}</td><td>R$ ${r.valor.toFixed(2)}</td><td>${r.tipo}</td><td>${r.categoria||"-"}</td>
                    <td><button class="remove-btn" onclick="removerRegistro(${i})">Remover</button></td>`;
    financeTable.appendChild(tr);
    if(r.tipo==="despesa" && r.categoria) catDespesa[r.categoria]=(catDespesa[r.categoria]||0)+r.valor;
  });
  saldo=registros.reduce((acc,r)=>acc+(r.tipo==="receita"?r.valor:-r.valor),0);
  saldoSpan.textContent=saldo.toFixed(2);
  localStorage.setItem("registros", JSON.stringify(registros));
  localStorage.setItem("saldo", saldo);

  const ctx=document.getElementById('despesaChart').getContext('2d');
  const labels = Object.keys(catDespesa).length ? Object.keys(catDespesa) : ['Sem despesas'];
  const dataValues = Object.keys(catDespesa).length ? Object.values(catDespesa) : [1];
  const colors = Object.keys(catDespesa).length ? Object.keys(catDespesa).map(cat=>categoriaColors[categorias.indexOf(cat)]||getRandomPastelColor()) : ['#eee'];

  if(despesaChart) despesaChart.destroy();
  despesaChart=new Chart(ctx,{
    type:'pie',
    data:{labels:labels, datasets:[{data:dataValues, backgroundColor:colors}]},
    options:{plugins:{tooltip:{callbacks:{label:function(context){
      const total=context.dataset.data.reduce((a,b)=>a+b,0);
      const value=context.raw;
      const percent=((value/total)*100).toFixed(1);
      return labels[0]==='Sem despesas'? 'Sem despesas' : `${context.label}: R$ ${value.toFixed(2)} (${percent}%)`;
    }}}}}
  });
}

function removerRegistro(index){ registros.splice(index,1); atualizarFinanceiro(); }

financeForm.onsubmit=e=>{
  e.preventDefault();
  const desc=document.getElementById("desc").value;
  const valor=parseFloat(document.getElementById("valor").value);
  const tipo=document.getElementById("tipo").value;
  const categoria=document.getElementById("categoria").value;
  registros.push({desc,valor,tipo,categoria});
  atualizarFinanceiro();
  financeForm.reset();
};
atualizarFinanceiro();

// ---------------- Configurações ----------------
const bgColorPicker=document.getElementById("bgColorPicker");
const textColorPicker=document.getElementById("textColorPicker");
const dayColorPicker=document.getElementById("dayColorPicker");
const fontSizePicker=document.getElementById("fontSizePicker");
const btnColorPicker=document.getElementById("btnColorPicker");
const btnHoverColorPicker=document.getElementById("btnHoverColorPicker");

function aplicarCores(){
  document.body.style.setProperty("--bg-color",localStorage.getItem("bgColor")||"#fff8e7");
  document.body.style.setProperty("--text-color",localStorage.getItem("textColor")||"#444");
  document.body.style.setProperty("--font-size",localStorage.getItem("fontSize")||16+"px");
  document.querySelectorAll(".day").forEach(d=>d.style.background=localStorage.getItem("dayColor")||"#ffe6f2");
  document.body.style.setProperty("--btn-color",localStorage.getItem("btnColor")||"#ffd6e8");
  document.body.style.setProperty("--btn-hover-color",localStorage.getItem("btnHoverColor")||"#fcbad3");
}

bgColorPicker.oninput=e=>{ localStorage.setItem("bgColor",e.target.value); aplicarCores();}
textColorPicker.oninput=e=>{ localStorage.setItem("textColor",e.target.value); aplicarCores();}
dayColorPicker.oninput=e=>{ localStorage.setItem("dayColor",e.target.value); aplicarCores();}
fontSizePicker.oninput=e=>{ localStorage.setItem("fontSize",e.target.value); aplicarCores();}
btnColorPicker.oninput=e=>{ localStorage.setItem("btnColor",e.target.value); aplicarCores();}
btnHoverColorPicker.oninput=e=>{ localStorage.setItem("btnHoverColor",e.target.value); aplicarCores();}

aplicarCores();
