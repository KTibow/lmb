import {
  type PriceRange,
  type ModelMetadata,
  modelMetadata,
  getPriceRange,
  getPrice,
} from "./model-metadata";

type Model = {
  first_seen: number;
  last_seen: number;
  data: Record<string, number[]>;
  status?: string;
};

function shouldShowModel(
  name: string,
  model: Model,
  metadata: ModelMetadata,
  drop: string[],
  models: { name: string; rating: number }[],
): boolean {
  if (model.status == "dead") return false;
  if (drop.includes("deprecated") && metadata?.deprecated) return false;
  if (drop.includes("semidead") && model.status == "semidead") return false;
  if (drop.includes("nonpareto")) {
    const price = getPrice(name);

    const thisModelScore = models.find((m) => m.name === name)?.rating;

    if (!price) return false;
    if (!thisModelScore) return false;
    if (
      models.some((other) => {
        const otherPrice = getPrice(other.name);
        if (otherPrice) {
          return other.rating > thisModelScore && otherPrice <= price;
        }
      })
    )
      return false;
  }
  if (drop.includes("nonparetoorg") || drop.includes("nonparetoconservative")) {
    const price = getPrice(name);

    const thisModelScore = models.find((m) => m.name === name)?.rating;

    const org = metadata?.organization;

    if (price && thisModelScore && org) {
      if (
        models.some((other) => {
          const otherPrice = getPrice(other.name);
          const otherMetadata = modelMetadata[other.name];
          return (
            otherPrice &&
            otherMetadata &&
            otherMetadata.organization == org &&
            other.rating > thisModelScore &&
            otherPrice <= price
          );
        })
      ) {
        return false;
      }
    } else {
      if (drop.includes("nonparetoorg")) {
        return false;
      }
    }
  }
  return true;
}

export interface ModelData {
  name: string;
  date: number;
  rating: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
}

export function filterModels(
  rows: [string, string, Model][],
  paradigm: string,
  categoryName: string,
  searches: string[],
  showOpenOnly: boolean,
  drop: string[],
  selectedPriceRanges: Set<PriceRange>,
): ModelData[] {
  let models: ModelData[] = [];

  // Build initial model data
  for (const [name, p, model] of rows) {
    if (paradigm != p) continue;
    if (!(categoryName in model.data)) continue;
    const details = model.data[categoryName];
    models.push({
      name,
      date: model.first_seen,
      rating: details[1],
      ciLow: details[1] - (details[0] || 0),
      ciHigh: details[1] + (details[2] || 0),
      rank: 0,
    });
  }

  // Sort and assign ranks
  models.sort((a, b) => b.rating - a.rating);
  for (const m of models) {
    const { ciHigh } = m;
    const nBetter = models
      .filter((other) =>
        shouldShowModel(
          other.name,
          rows.find((m) => m[0] == other.name && m[1] == paradigm)![2],
          modelMetadata[other.name],
          drop,
          models,
        ),
      )
      .filter((other) => {
        return other.ciLow > ciHigh;
      }).length;
    m.rank = nBetter + 1;
  }

  // Apply other filters
  models = models.filter((model) => {
    const name = model.name.toLowerCase();
    const tests = searches.filter(Boolean);
    if (tests.length == 0) return true;
    return tests.some((test) => name.includes(test.toLowerCase()));
  });

  if (showOpenOnly) {
    models = models.filter((model) => {
      const metadata = modelMetadata[model.name];
      return metadata?.isOpen == true;
    });
  }

  models = models.filter((model) => {
    if (selectedPriceRanges.size == 0) return true;
    const price = getPrice(model.name);
    const priceRange = price && getPriceRange(price);
    if (!priceRange) return false;
    return selectedPriceRanges.has(priceRange);
  });

  models = models.filter((model) => {
    const name = model.name;
    return shouldShowModel(
      name,
      rows.find((m) => m[0] == name && m[1] == paradigm)![2],
      modelMetadata[name],
      drop,
      models,
    );
  });

  return models;
}
