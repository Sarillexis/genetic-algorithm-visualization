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

export default Individual;
