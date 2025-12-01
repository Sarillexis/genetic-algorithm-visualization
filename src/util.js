const factorialMemo = new Map([[0, 1], [1, 1]]);
export const factorial = num => {
  if (factorialMemo.has(num)) return factorialMemo.get(num);
  let result = 1;
  for (let i = 2; i <= num; i += 1) {
    result *= i;
  }
  factorialMemo.set(num, result);
  return result;
};

export const shuffleCoordinates = coordinates => {
  const shuffled = coordinates.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createDistanceCalculator = coordinates => {
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

export const drawPoints = (ctx, individual, pxSize = 5) => {
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

export const drawIndividual = (ctx, individual) => {
  clearCanvas(ctx);
  drawPoints(ctx, individual);
  drawPaths(ctx, individual);
};

export const clearCanvas = canvasOrContext => {
  const canvas = canvasOrContext.canvas || canvasOrContext;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const renderRunStats = (population, { generationEl, screenedEl, bestDistanceEl, startingDistanceEl }) => {
  generationEl.textContent = population.genNumber;
  screenedEl.textContent = (population.genNumber * population.popSize).toLocaleString();
  const fittestEver = population.fittestEver;
  if (startingDistanceEl && population.genNumber === 0) {
    startingDistanceEl.textContent = Math.floor(population.getFittest().distance);
  }
  bestDistanceEl.textContent = Math.floor(fittestEver.distance);
};

export const renderFittestPreview = (fittestCtx, individual) => {
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

export const generateRandomCoords = (num, canvas) => {
  const newCoords = [];
  for (let i = 0; i < num; i += 1) {
    newCoords.push([
      Math.random() * canvas.width,
      Math.random() * canvas.height
    ]);
  }
  return newCoords;
};
