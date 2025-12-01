(() => {
  const factorialMemo = new Map([[0, 1], [1, 1]]);
  const factorial = num => {
    if (factorialMemo.has(num)) return factorialMemo.get(num);
    let result = 1;
    for (let i = 2; i <= num; i += 1) {
      result *= i;
    }
    factorialMemo.set(num, result);
    return result;
  };

  const shuffleCoordinates = coordinates => {
    const shuffled = coordinates.slice();
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createDistanceCalculator = coordinates => {
    const cache = new Map();
    const key = (a, b) => `${a[0]},${a[1]}-${b[0]},${b[1]}`;

    return (pointA, pointB) => {
      const forwardKey = key(pointA, pointB);
      const reverseKey = key(pointB, pointA);
      if (cache.has(forwardKey)) return cache.get(forwardKey);
      if (cache.has(reverseKey)) return cache.get(reverseKey);

      const distance = Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
      cache.set(forwardKey, distance);
      return distance;
    };
  };

  const drawPoints = (ctx, individual, pxSize = 5) => {
    const offset = pxSize / 2;
    individual.chromosome.forEach(gene => {
      ctx.fillRect(gene[0] - offset, gene[1] - offset, pxSize, pxSize);
    });
  };

  const drawPaths = (ctx, individual) => {
    ctx.beginPath();
    individual.chromosome.forEach((gene, idx) => {
      if (idx === 0) {
        ctx.moveTo(gene[0], gene[1]);
      } else {
        ctx.lineTo(gene[0], gene[1]);
      }
    });

    ctx.closePath();
    ctx.stroke();
  };

  const drawIndividual = (ctx, individual) => {
    clearCanvas(ctx);
    drawPoints(ctx, individual);
    drawPaths(ctx, individual);
  };

  const clearCanvas = canvasOrContext => {
    const canvas = canvasOrContext.canvas || canvasOrContext;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const renderRunStats = (population, { generationEl, screenedEl, bestDistanceEl, startingDistanceEl }) => {
    generationEl.textContent = population.genNumber;
    screenedEl.textContent = (population.genNumber * population.popSize).toLocaleString();
    const fittestEver = population.fittestEver;
    if (startingDistanceEl && population.genNumber === 0) {
      startingDistanceEl.textContent = Math.floor(population.getFittest().distance);
    }
    bestDistanceEl.textContent = Math.floor(fittestEver.distance);
  };

  const renderFittestPreview = (fittestCtx, individual) => {
    if (!fittestCtx || !individual) {
      if (fittestCtx) clearCanvas(fittestCtx);
      return;
    }

    clearCanvas(fittestCtx);
    const pxSize = 2;
    const offset = pxSize / 2;
    individual.chromosome.forEach(gene => {
      fittestCtx.fillRect(gene[0] / 2 - offset, gene[1] / 2 - offset, pxSize, pxSize);
    });
    fittestCtx.beginPath();
    individual.chromosome.forEach((gene, idx) => {
      if (idx === 0) {
        fittestCtx.moveTo(gene[0] / 2, gene[1] / 2);
      } else {
        fittestCtx.lineTo(gene[0] / 2, gene[1] / 2);
      }
    });
    fittestCtx.closePath();
    fittestCtx.stroke();
  };

  const generateRandomCoords = (num, canvas) => {
    const newCoords = [];
    for (let i = 0; i < num; i += 1) {
      newCoords.push([
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ]);
    }
    return newCoords;
  };

  class Individual {
    constructor(distanceCalculator, mutProb, ...coordinates) {
      this.geneCount = coordinates.length;
      this.mutProb = mutProb;
      this.distanceCalculator = distanceCalculator;
      this.chromosome = coordinates.slice();
      this.calculateDistance();
    }

    calculateDistance() {
      let sumDist = 0;
      for (let i = 0; i < this.chromosome.length - 1; i += 1) {
        sumDist += this.distanceCalculator(this.chromosome[i], this.chromosome[i + 1]);
      }
      sumDist += this.distanceCalculator(this.chromosome[0], this.chromosome.slice(-1)[0]);
      this.distance = sumDist;
      return sumDist;
    }

    mutate() {
      let mutated = false;

      if (Math.random() < this.mutProb) {
        const mutationStrategies = [
          this.reverseSegmentMutation.bind(this),
          this.twoOptMutation.bind(this)
        ];

        while (mutationStrategies.length && !mutated) {
          const strategyIdx = Math.floor(Math.random() * mutationStrategies.length);
          const [strategy] = mutationStrategies.splice(strategyIdx, 1);
          mutated = strategy();
        }
      }

      if (mutated) this.calculateDistance();
      return this.chromosome;
    }

    reverseSegmentMutation() {
      const len = this.chromosome.length;
      if (len < 2) return false;

      let idx1 = Math.floor(Math.random() * len);
      let idx2 = Math.floor(Math.random() * len);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * len);
      }

      if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];

      for (let start = idx1, end = idx2; start < end; start += 1, end -= 1) {
        [this.chromosome[start], this.chromosome[end]] =
          [this.chromosome[end], this.chromosome[start]];
      }

      return true;
    }

    twoOptMutation() {
      const len = this.chromosome.length;
      if (len < 4) return false;

      let idx1 = Math.floor(Math.random() * len);
      let idx2 = Math.floor(Math.random() * len);
      while (
        idx2 === idx1 ||
        Math.abs(idx2 - idx1) < 2 ||
        Math.abs(idx2 - idx1) === len - 1
      ) {
        idx2 = Math.floor(Math.random() * len);
      }

      if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];

      const beforeIdx1 = (idx1 - 1 + len) % len;
      const afterIdx2 = (idx2 + 1) % len;

      const currentDistance =
        this.distanceCalculator(this.chromosome[beforeIdx1], this.chromosome[idx1]) +
        this.distanceCalculator(this.chromosome[idx2], this.chromosome[afterIdx2]);

      const newDistance =
        this.distanceCalculator(this.chromosome[beforeIdx1], this.chromosome[idx2]) +
        this.distanceCalculator(this.chromosome[idx1], this.chromosome[afterIdx2]);

      if (newDistance < currentDistance) {
        for (let start = idx1, end = idx2; start < end; start += 1, end -= 1) {
          [this.chromosome[start], this.chromosome[end]] =
            [this.chromosome[end], this.chromosome[start]];
        }
        return true;
      }

      return false;
    }

    mate(crossProb, otherInd) {
      if (Math.random() < crossProb) {
        const childChromosomes = [];
        const coordKey = gene => `${gene[0]}:${gene[1]}`;

        while (childChromosomes.length < 2) {
          const donor  = (childChromosomes.length === 0) ? this    : otherInd;
          const filler = (childChromosomes.length === 0) ? otherInd : this;

          const len = donor.chromosome.length;

          let idx1 = Math.floor(Math.random() * len);
          while (idx1 >= len - 1) {
            idx1 = Math.floor(Math.random() * len);
          }
          let idx2 = idx1 + Math.ceil(Math.random() * (len - idx1));

          const childChromosome = new Array(len);

          for (let i = idx1; i < idx2; i += 1) {
            childChromosome[i] = donor.chromosome[i];
          }

          const existingKeys = new Set();
          childChromosome.forEach(gene => {
            if (gene) existingKeys.add(coordKey(gene));
          });

          const reorderedSecondParent = [];
          for (let i = 0; i < len; i += 1) {
            reorderedSecondParent[i] = filler.chromosome[(idx2 + i) % len];
          }

          let childIdx = idx2;
          reorderedSecondParent.forEach(gene => {
            const key = coordKey(gene);
            if (!existingKeys.has(key)) {
              childChromosome[childIdx % len] = gene;
              existingKeys.add(key);
              childIdx += 1;
            }
          });

        childChromosomes.push(childChromosome);
      }

      const children = [];
      childChromosomes.forEach(chromosome => {
        const child = new Individual(this.distanceCalculator, this.mutProb, ...chromosome);
        child.mutate();
        children.push(child);
      });
      return children;
    }

    const firstParentClone = new Individual(this.distanceCalculator, this.mutProb, ...this.chromosome);
    const secondParentClone = new Individual(this.distanceCalculator, this.mutProb, ...otherInd.chromosome);
    firstParentClone.mutate();
    secondParentClone.mutate();
    return [firstParentClone, secondParentClone];
  }
}

  class Population {
    constructor(popSize, crossProb, mutProb, elitismRate, ...coordinates) {
      this.coordinates = coordinates;
      this.popSize = popSize;
      this.crossProb = crossProb;
      this.mutProb = mutProb;
      this.elitismRate = elitismRate;
      this.distanceCalculator = createDistanceCalculator(coordinates);
      this.totalFitness = 0;
      this.currentGen = [];
      this.genNumber = 0;
      this.numPossibleRoutes = factorial(coordinates.length);

      for (let i = 0; i < popSize; i += 1) {
        const chromosome = shuffleCoordinates(coordinates);
        const individual = new Individual(this.distanceCalculator, mutProb, ...chromosome);
        this.currentGen.push(individual);
      }

      this.assignFitness();
      this.fittestEver = this.getFittest();
    }

    assignFitness() {
      this.totalFitness = 0;
      this.currentGen.forEach(individual => {
        individual.rawFitness = 1 / individual.distance;
        this.totalFitness += individual.rawFitness;
      });

      this.currentGen.forEach(individual => {
        individual.fitness = individual.rawFitness / this.totalFitness;
      });
    }

    selectParentTournament(k = 3) {
      let best = null;
      for (let i = 0; i < k; i += 1) {
        const candidate = this.currentGen[Math.floor(Math.random() * this.currentGen.length)];
        if (!best || candidate.distance < best.distance) {
          best = candidate;
        }
      }
      return best;
    }

    createNextGen() {
      let nextGen = [];
      if (this.elitismRate) nextGen = nextGen.concat(this.passElites());

      while (nextGen.length < this.popSize) {
        const parent1 = this.selectParentTournament(3);
        const parent2 = this.selectParentTournament(3);

        const newChildren = parent1.mate(this.crossProb, parent2);
        nextGen = nextGen.concat(newChildren);
      }

      this.currentGen = nextGen.slice(0, this.popSize);
      this.genNumber += 1;

      this.assignFitness();

      const currentGenFittest = this.getFittest();
      if (currentGenFittest.distance < this.fittestEver.distance) {
        this.fittestEver = currentGenFittest;
      }
    }

    passElites() {
      const sortedInds = this.currentGen.slice().sort((a, b) => (a.distance < b.distance ? -1 : 1));
      const numElites = Math.floor(this.elitismRate * this.popSize);
      return sortedInds.slice(0, numElites);
    }

    getFittest() {
      let fittest = this.currentGen[0];
      this.currentGen.forEach(individual => {
        if (individual.distance < fittest.distance) {
          fittest = individual;
        }
      });
      return fittest;
    }
  }

  const DEFAULT_RANDOM_POINTS = 15;

  const getSliderValue = slider => parseFloat(slider.value);

  const initializeApp = (ctx, fittestCtx) => {
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

  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const fittestCanvas = document.getElementById('fittest');
    const fittestCtx = fittestCanvas ? fittestCanvas.getContext('2d') : null;

    initializeApp(ctx, fittestCtx);
  });
})();
