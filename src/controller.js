import Population from './population';
import {
  clearCanvas,
  drawIndividual,
  generateRandomCoords,
  renderFittestPreview,
  renderRunStats
} from './util';

const DEFAULT_RANDOM_POINTS = 15;

const getSliderValue = slider => parseFloat(slider.value);

export const initializeApp = (ctx, fittestCtx) => {
  const canvas = ctx.canvas;
  const controls = {
    startBtn: document.getElementById('start'),
    stopBtn: document.getElementById('stop'),
    resetBtn: document.getElementById('reset'),
    clearBtn: document.getElementById('clear'),
    randomPointsLabel: document.getElementById('random-points-label'),
    randomPointsSlider: document.getElementById('random-points-slider'),
    generateRandomBtn: document.getElementById('generate-random'),
    popSizeLabel: document.getElementById('popsize-label'),
    popSizeSlider: document.getElementById('popsize-slider'),
    mutationLabel: document.getElementById('mutation-label'),
    mutationSlider: document.getElementById('mutation-slider'),
    crossLabel: document.getElementById('cross-label'),
    crossSlider: document.getElementById('cross-slider'),
    elitismLabel: document.getElementById('elitism-label'),
    elitismSlider: document.getElementById('elitism-slider'),
    currentGenerationDisplay: document.getElementById('current-generation'),
    individualsScreenedDisplay: document.getElementById('individuals-screened'),
    startingDistanceDisplay: document.getElementById('starting-distance'),
    bestDistanceDisplay: document.getElementById('best-distance')
  };

  const state = {
    coordinates: [],
    population: null,
    evolveInt: null
  };

  const renderCoordinates = () => {
    clearCanvas(canvas);
    if (!state.coordinates.length) return;

    const pxSize = 5;
    const offset = pxSize / 2;
    state.coordinates.forEach(point => {
      ctx.fillRect(point[0] - offset, point[1] - offset, pxSize, pxSize);
    });
  };

  const resetRunStats = () => {
    controls.currentGenerationDisplay.textContent = 0;
    controls.individualsScreenedDisplay.textContent = 0;
    controls.startingDistanceDisplay.textContent = '';
    controls.bestDistanceDisplay.textContent = '';
  };

  const applyNewCoordinates = newCoords => {
    state.coordinates = newCoords;
    state.population = null;
    stopEvolution();
    renderCoordinates();
    resetRunStats();
    renderFittestPreview(fittestCtx, null);
  };

  const buildPopulationConfig = () => ({
    popSize: parseInt(getSliderValue(controls.popSizeSlider), 10),
    crossProb: getSliderValue(controls.crossSlider),
    mutProb: getSliderValue(controls.mutationSlider),
    elitismRate: getSliderValue(controls.elitismSlider)
  });

  const ensurePopulation = () => {
    if (!state.population && state.coordinates.length) {
      const { popSize, crossProb, mutProb, elitismRate } = buildPopulationConfig();
      state.population = new Population(popSize, crossProb, mutProb, elitismRate, ...state.coordinates);
      controls.startingDistanceDisplay.textContent = Math.floor(state.population.getFittest().distance);
      controls.bestDistanceDisplay.textContent = Math.floor(state.population.fittestEver.distance);
    }
    return state.population;
  };

  const evolutionStep = () => {
    const population = ensurePopulation();
    if (!population) return;
    population.createNextGen();
    const currentGenFittest = population.getFittest();
    drawIndividual(ctx, currentGenFittest);
    renderRunStats(population, {
      generationEl: controls.currentGenerationDisplay,
      screenedEl: controls.individualsScreenedDisplay,
      bestDistanceEl: controls.bestDistanceDisplay,
      startingDistanceEl: controls.startingDistanceDisplay
    });
    renderFittestPreview(fittestCtx, population.fittestEver);
  };

  const stopEvolution = () => {
    if (state.evolveInt) {
      clearInterval(state.evolveInt);
      state.evolveInt = null;
    }
  };

  const beginEvolution = () => {
    if (state.evolveInt) return;
    ensurePopulation();
    if (!state.population) return;
    drawIndividual(ctx, state.population.getFittest());
    renderFittestPreview(fittestCtx, state.population.fittestEver);
    state.evolveInt = setInterval(evolutionStep, 100);
  };

  const resetPopulation = () => {
    stopEvolution();
    const { popSize, crossProb, mutProb, elitismRate } = buildPopulationConfig();
    state.population = new Population(popSize, crossProb, mutProb, elitismRate, ...state.coordinates);
    renderCoordinates();
    resetRunStats();
    controls.startingDistanceDisplay.textContent = Math.floor(state.population.getFittest().distance);
    controls.bestDistanceDisplay.textContent = Math.floor(state.population.fittestEver.distance);
  };

  const clearPopulation = () => {
    stopEvolution();
    state.coordinates = [];
    state.population = null;
    clearCanvas(canvas);
    renderFittestPreview(fittestCtx, null);
    resetRunStats();
  };

  controls.popSizeLabel.textContent = controls.popSizeSlider.value;
  controls.popSizeSlider.oninput = () => {
    controls.popSizeLabel.textContent = controls.popSizeSlider.value;
    state.population = null;
  };

  controls.mutationLabel.textContent = controls.mutationSlider.value;
  controls.mutationSlider.oninput = () => {
    controls.mutationLabel.textContent = controls.mutationSlider.value;
    state.population = null;
  };

  controls.crossLabel.textContent = controls.crossSlider.value;
  controls.crossSlider.oninput = () => {
    controls.crossLabel.textContent = controls.crossSlider.value;
    state.population = null;
  };

  controls.elitismLabel.textContent = controls.elitismSlider.value;
  controls.elitismSlider.oninput = () => {
    controls.elitismLabel.textContent = controls.elitismSlider.value;
    state.population = null;
  };

  let randomPoints = parseInt(controls.randomPointsSlider.value, 10) || DEFAULT_RANDOM_POINTS;
  controls.randomPointsLabel.textContent = `${randomPoints}`;
  controls.randomPointsSlider.oninput = () => {
    randomPoints = parseInt(controls.randomPointsSlider.value, 10);
    controls.randomPointsLabel.textContent = `${randomPoints}`;
  };

  controls.generateRandomBtn.addEventListener('click', () => {
    applyNewCoordinates(generateRandomCoords(randomPoints, canvas));
  });

  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.coordinates.push([x, y]);
    renderCoordinates();
    state.population = null;
  });

  controls.startBtn.addEventListener('click', beginEvolution);
  controls.stopBtn.addEventListener('click', stopEvolution);
  controls.resetBtn.addEventListener('click', resetPopulation);
  controls.clearBtn.addEventListener('click', clearPopulation);

  applyNewCoordinates(generateRandomCoords(DEFAULT_RANDOM_POINTS, canvas));
};
