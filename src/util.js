import Population from './population';

export const factorial = num => {
  return (num <= 1) ? 1 : num * factorial(num-1)
};

export const drawPoints = (ctx, individual) => {
  const pxSize = 5;
  const offset = pxSize / 2;
  individual.chromosome.forEach(gene => {
    ctx.fillRect(gene[0] - offset, gene[1] - offset, pxSize, pxSize);
  });
};

export const drawPaths = (ctx, individual) => {
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

const formatRouteCount = coordinates => {
  if (coordinates.length < 2) return '0';
  return Math.ceil(factorial(coordinates.length - 1) / 2).toLocaleString();
};

export const clearCanvas = canvasOrContext => {
  const canvas = canvasOrContext.canvas || canvasOrContext;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const startEvolution = (ctx, population) => {
  const evolveInt = setInterval(() => {
    population.createNextGen();
    let fittest = population.getFittest();
    clearCanvas(ctx);
    drawPoints(ctx, fittest);
    drawPaths(ctx, fittest);
  }, 1000);
  return evolveInt;
}

export const stopEvolution = evolveInt => {
  clearInterval(evolveInt);
}

export const evolutionLoop = (ctx, fittestCtx, population) => {
  population.createNextGen();
  let currentGenFittest = population.getFittest();
  clearCanvas(ctx);
  clearCanvas(fittestCtx);
  // clearCanvas(fittestCanvas);
  drawPoints(ctx, currentGenFittest);
  drawPaths(ctx, currentGenFittest);
  document.getElementById('current-generation').innerHTML = population.genNumber;
  document.getElementById('individuals-screened').innerHTML = (population.genNumber * population.popSize).toLocaleString();
  let fittestEver = population.fittestEver
  document.getElementById('best-distance').innerHTML = Math.floor(fittestEver.distance)

  const pxSize = 2;
  const offset = pxSize / 2;
  fittestEver.chromosome.forEach((gene, ix) => {
    fittestCtx.fillRect(gene[0]/2 - offset, gene[1]/2 - offset, pxSize, pxSize);
  });
  fittestCtx.beginPath();
  fittestEver.chromosome.forEach((gene, idx) => {
    if (idx === 0) {
      fittestCtx.moveTo(gene[0]/2, gene[1]/2);
    } else {
      fittestCtx.lineTo(gene[0]/2, gene[1]/2);
    }
  });
  fittestCtx.closePath();
  fittestCtx.stroke();
};

export const addButtonListeners = (ctx, fittestCtx) => {
  const canvas = ctx.canvas;
  const startBtn = document.getElementById('start');
  const stopBtn  = document.getElementById('stop');
  const resetBtn = document.getElementById('reset');
  const clearBtn = document.getElementById('clear');
  const randomPointsLabel = document.getElementById('random-points-label');
  const randomPointsSlider = document.getElementById('random-points-slider');
  const generateRandomBtn = document.getElementById('generate-random');
  let evolveInt = null;
  let population;

  let totalRoutesDisplay = document.getElementById('total-possible-routes')
  const currentGenerationDisplay = document.getElementById('current-generation');
  const individualsScreenedDisplay = document.getElementById('individuals-screened');
  const startingDistanceDisplay = document.getElementById('starting-distance');
  const bestDistanceDisplay = document.getElementById('best-distance');

  const stopEvol = () => {
    if (evolveInt) {
      clearInterval(evolveInt);
      evolveInt = null;
    }
  }

  const resetRunStats = () => {
    currentGenerationDisplay.innerHTML = 0;
    individualsScreenedDisplay.innerHTML = 0;
  };

  const clearDistanceDisplays = () => {
    startingDistanceDisplay.innerHTML = '';
    bestDistanceDisplay.innerHTML = '';
  };

  const generateRandomCoords = num => {
    let newCoords = [];
    for (let i = 0; i < num; i++) {
      newCoords.push([
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ])
    }
    return newCoords;
  }

  let coordinates = [];

  const updateTotalRoutes = () => {
    const possibleRoutes = coordinates.length > 1 ? Math.ceil(factorial(coordinates.length - 1) / 2) : 0;
    totalRoutesDisplay.innerHTML = possibleRoutes ? possibleRoutes.toLocaleString() : '';
  };

  const renderCoordinates = () => {
    clearCanvas(canvas);
    fittestCtx.clearRect(0, 0, canvas.width, canvas.height)
    const pxSize = 5;
    const offset = pxSize / 2;
    coordinates.forEach(point => {
      ctx.fillRect(point[0] - offset, point[1] - offset, pxSize, pxSize);
    });
  }

  const applyNewCoordinates = newCoords => {
    stopEvol();
    coordinates = newCoords;
    population = null;
    renderCoordinates();
    updateTotalRoutes();
    resetRunStats();
    clearDistanceDisplays();
  };

  applyNewCoordinates(generateRandomCoords(15));

  const beginEvol = () => {
    population = population ? population : new Population(popSize, crossProb, mutProb, elitismRate, ...coordinates)
    evolveInt = setInterval(() => evolutionLoop(ctx, fittestCtx, population), 100);
    startingDistanceDisplay.innerHTML = Math.floor(population.getFittest().distance);
    bestDistanceDisplay.innerHTML = Math.floor(population.fittestEver.distance)
  }

  const resetPop = () => {
    stopEvol();
    population = new Population(popSize, crossProb, mutProb, elitismRate, ...coordinates)
    renderCoordinates();
    resetRunStats();
  }

  const clearPop = () => {
    stopEvol()
    coordinates = [];
    population = null;
    renderCoordinates();
    // console.log('clearing');
    updateTotalRoutes();
    resetRunStats();
    clearDistanceDisplays();
  }

  const popSizeLabel = document.getElementById('popsize-label');
  const popSizeSlider = document.getElementById('popsize-slider');
  let popSize = parseInt(popSizeSlider.value, 10);
  popSizeLabel.innerHTML = `${popSize}`;
  popSizeSlider.oninput = () => {
    popSize = parseInt(popSizeSlider.value, 10);
    popSizeLabel.innerHTML = `${popSize}`;
    // console.log(popSize);
  };
  const mutationLabel = document.getElementById('mutation-label');
  const mutationSlider = document.getElementById('mutation-slider');
  let mutProb = parseFloat(mutationSlider.value);
  mutationLabel.innerHTML = `${mutProb}`;
  mutationSlider.oninput = () => {
    mutProb = parseFloat(mutationSlider.value);
    mutationLabel.innerHTML = `${mutProb}`
    // console.log(mutProb);
  };
  const crossLabel = document.getElementById('cross-label');
  const crossSlider = document.getElementById('cross-slider');
  let crossProb = parseFloat(crossSlider.value);
  crossLabel.innerHTML = `${crossProb}`;
  crossSlider.oninput = () => {
    crossProb = parseFloat(crossSlider.value);
    crossLabel.innerHTML = `${crossProb}`;
    // console.log(crossProb);
  };
  const elitismLabel = document.getElementById('elitism-label');
  const elitismSlider = document.getElementById('elitism-slider');
  let elitismRate = parseFloat(elitismSlider.value);
  elitismLabel.innerHTML = `${elitismRate}`;
  elitismSlider.oninput = () => {
    elitismRate = parseFloat(elitismSlider.value);
    elitismLabel.innerHTML = `${elitismRate}`;
    // console.log(elitismRate);
  };

  let randomPoints = parseInt(randomPointsSlider.value, 10);
  randomPointsLabel.innerHTML = `${randomPoints}`;
  randomPointsSlider.oninput = () => {
    randomPoints = parseInt(randomPointsSlider.value, 10);
    randomPointsLabel.innerHTML = `${randomPoints}`;
  };

  generateRandomBtn.addEventListener('click', () => {
    applyNewCoordinates(generateRandomCoords(randomPoints));
  });

  canvas.addEventListener('click', function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    // console.log("x: " + x + " y: " + y);
    coordinates.push([x, y])
    // console.log('coordinates: ', coordinates)
    const pxSize = 5;
    const offset = pxSize / 2;
    ctx.fillRect(x - offset, y - offset, pxSize, pxSize);
    updateTotalRoutes();
  }, false);

  // console.log(`popsize: ${popSize}, mutprob: ${mutProb}, crossprob: ${crossProb}`)

  startBtn.addEventListener('click', beginEvol);
  stopBtn.addEventListener('click', stopEvol);
  resetBtn.addEventListener('click', resetPop);
  clearBtn.addEventListener('click', clearPop);
}
