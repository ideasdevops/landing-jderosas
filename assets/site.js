const additional = document.querySelector('#mas-proyectos');

function revealDetailsForHash() {
  const linkedSection = document.getElementById(location.hash.slice(1));
  if (linkedSection && additional.contains(linkedSection) && linkedSection !== additional) {
    additional.open = true;
  }
}

revealDetailsForHash();
window.addEventListener('hashchange', revealDetailsForHash);

const form = document.querySelector('#guia');
const result = document.querySelector('#resultado');
const steps = Array.from(form.querySelectorAll('fieldset'));
const stepLabel = document.querySelector('#paso');
const progress = document.querySelector('#progreso');
const backButton = document.querySelector('#atras');
const nextButton = document.querySelector('#siguiente');
const changeInput = document.querySelector('#cambio');
const actionInput = document.querySelector('#accion');
const summary = document.querySelector('#resumen');
const feedback = document.querySelector('#feedback');

const routes = {
  personal: {
    label: 'En mí',
    changeExample: 'Por ejemplo, sostener una prioridad durante la semana.',
    actionExample: 'Por ejemplo, reservar un momento para avanzar en esa prioridad.',
    suggestedAction: 'Elegir una acción chica y reservarle un momento esta semana.'
  },
  organizacion: {
    label: 'En mi organización',
    changeExample: 'Por ejemplo, resolver pedidos sin cargar los mismos datos varias veces.',
    actionExample: 'Por ejemplo, seguir un pedido de principio a fin y marcar dónde se traba.',
    suggestedAction: 'Seguir un caso real, marcar dónde se traba y conversarlo con quien lo lleva.'
  }
};

let currentStep = 0;
let activeRoute = null;

function showStep(index, moveFocus = true) {
  currentStep = index;
  result.hidden = true;
  form.hidden = false;

  for (const [position, fieldset] of steps.entries()) {
    fieldset.hidden = position !== index;
    fieldset.disabled = position !== index;
  }

  stepLabel.textContent = `Paso ${index + 1} de ${steps.length}`;
  progress.value = index + 1;
  progress.textContent = `${index + 1} de ${steps.length}`;
  backButton.hidden = index === 0;
  nextButton.firstChild.textContent = index === steps.length - 1 ? 'Ver mi resumen ' : 'Continuar ';

  if (moveFocus) steps[index].querySelector('legend').focus({ preventScroll: true });
}

function selectedRoute() {
  const selected = form.querySelector('input[name="route"]:checked');
  return selected ? routes[selected.value] : null;
}

function updateExamples() {
  const route = selectedRoute();
  if (activeRoute && route !== activeRoute) {
    changeInput.value = '';
    actionInput.value = '';
    changeInput.setCustomValidity('');
  }
  activeRoute = route;
  document.querySelector('#cambio-ejemplo').textContent = route.changeExample;
  document.querySelector('#accion-ejemplo').textContent = route.actionExample;
}

function showSummary() {
  const route = selectedRoute();
  const action = actionInput.value.trim();
  const actionLabel = action ? 'Mi próximo paso' : 'Un paso posible';

  summary.value = [
    'Mi punto de partida',
    `Dónde quiero empezar: ${route.label}.`,
    `Qué quiero cambiar: ${changeInput.value.trim()}`,
    `${actionLabel}: ${action || route.suggestedAction}`
  ].join('\n\n');
  feedback.textContent = '';
  form.hidden = true;
  result.hidden = false;
  result.querySelector('h3').focus({ preventScroll: true });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (currentStep === 0) updateExamples();
  if (currentStep === 1 && !changeInput.value.trim()) {
    changeInput.setCustomValidity('Escribí una línea sobre lo que te gustaría cambiar.');
    changeInput.reportValidity();
    return;
  }

  if (currentStep < steps.length - 1) {
    showStep(currentStep + 1);
  } else {
    showSummary();
  }
});

changeInput.addEventListener('input', () => changeInput.setCustomValidity(''));
backButton.addEventListener('click', () => showStep(currentStep - 1));

for (const link of document.querySelectorAll('[data-route]')) {
  link.addEventListener('click', () => {
    const choice = form.querySelector(`input[value="${link.dataset.route}"]`);
    choice.checked = true;
    updateExamples();
    showStep(1);
  });
}

document.querySelector('#editar').addEventListener('click', () => showStep(2));

document.querySelector('#reiniciar').addEventListener('click', () => {
  form.reset();
  activeRoute = null;
  changeInput.setCustomValidity('');
  summary.value = '';
  feedback.textContent = '';
  showStep(0);
});

document.querySelector('#copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summary.value);
    feedback.textContent = 'Resumen copiado.';
  } catch {
    summary.focus({ preventScroll: true });
    summary.select();
    feedback.textContent = 'Resumen seleccionado. Podés copiarlo desde tu dispositivo.';
  }
});

showStep(0, false);

const filterBox = document.querySelector('#map-filter');
const projectFilter = document.querySelector('#project-filter');
const filterCount = document.querySelector('#map-count');
const goals = Array.from(document.querySelectorAll('[data-goal]')).map((link) => ({
  link,
  row: link.parentElement,
  panel: document.getElementById(`ods-${link.dataset.goal}`),
  projects: link.parentElement.dataset.projects.split(' ')
}));
let activeGoal = goals.find((goal) => `#${goal.panel.id}` === location.hash) ?? goals[3];

function matchingGoals() {
  return goals.filter((goal) => projectFilter.value === 'all' || goal.projects.includes(projectFilter.value));
}

function renderGoals(visible, focusPanel = false) {
  const visibleSet = new Set(visible);
  for (const goal of goals) {
    goal.row.hidden = !visibleSet.has(goal);
    goal.panel.hidden = goal !== activeGoal;
    if (goal === activeGoal) {
      goal.link.setAttribute('aria-current', 'true');
    } else {
      goal.link.removeAttribute('aria-current');
    }
  }
  const total = visible.length;
  filterCount.textContent = `${total} de 17 objetivos`;
  if (focusPanel) activeGoal.panel.querySelector('h3').focus({ preventScroll: true });
}

function applyProjectFilter() {
  const visible = matchingGoals();
  if (!visible.includes(activeGoal)) activeGoal = visible[0];
  renderGoals(visible);
}

for (const goal of goals) {
  goal.link.addEventListener('click', (event) => {
    event.preventDefault();
    activeGoal = goal;
    renderGoals(matchingGoals(), true);
    if (location.hash !== goal.link.hash) history.pushState(null, '', goal.link.hash);

    if (window.matchMedia('(max-width: 760px)').matches) {
      goal.panel.scrollIntoView({ block: 'start' });
    }
  });
}
projectFilter.addEventListener('change', () => {
  applyProjectFilter();
  if (location.hash.startsWith('#ods-')) history.replaceState(null, '', '#mapa');
});

for (const link of document.querySelectorAll('[data-project]')) {
  link.addEventListener('click', () => {
    projectFilter.value = link.dataset.project;
    applyProjectFilter();
  });
}

window.addEventListener('hashchange', () => {
  const requested = goals.find((goal) => `#${goal.panel.id}` === location.hash);
  if (!requested) return;
  if (!matchingGoals().includes(requested)) projectFilter.value = 'all';
  activeGoal = requested;
  renderGoals(matchingGoals());
  requested.panel.scrollIntoView({ block: 'start' });
});

filterBox.hidden = false;
renderGoals(goals);

