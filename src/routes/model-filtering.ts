import {
  type PriceRange,
  type ModelMetadata,
  modelMetadata,
  getPriceRange,
  getPrice,
} from "./model-metadata";

export type Model = {
  name: string;
  date: number;
  rating: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
  price: number | undefined;
};
export type ModelRaw = {
  first_seen: number;
  last_seen: number;
  data: Record<string, number[]>;
  status?: string;
};

function shouldShowModel(
  model: Model,
  modelRaw: ModelRaw,
  metadata: ModelMetadata,
  drop: string[],
  models: Model[],
): boolean {
  if (modelRaw.status == "dead") return false;
  if (drop.includes("deprecated") && metadata?.deprecated) return false;
  if (drop.includes("semidead") && modelRaw.status == "semidead") return false;
  if (drop.includes("nonpareto")) {
    const price = model.price;
    const rating = model.rating;

    if (!price) return false;
    if (!rating) return false;
    if (
      models.some((other) => {
        return other.price && other.rating > rating && other.price <= price;
      })
    )
      return false;
  }
  if (drop.includes("nonparetoorg") || drop.includes("nonparetoconservative")) {
    const price = model.price;
    const rating = model.rating;
    const org = metadata?.organization;

    if (price && rating && org) {
      if (
        models.some((other) => {
          const otherMetadata = modelMetadata[other.name];
          return (
            other.price &&
            otherMetadata &&
            otherMetadata.organization == org &&
            other.rating > rating &&
            other.price <= price
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

export function filterModels(
  rows: [string, string, ModelRaw][],
  paradigm: string,
  categoryName: string,
  searches: string[],
  showOpenOnly: boolean,
  drop: string[],
  selectedPriceRanges: Set<PriceRange>,
): Model[] {
  let models: Model[] = [];

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
      price: getPrice(name),
    });
  }

  // Sort and assign ranks
  models.sort((a, b) => b.rating - a.rating);
  for (const m of models) {
    const { ciHigh } = m;
    const nBetter = models
      .filter((other) =>
        shouldShowModel(
          other,
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
    const priceRange = model.price && getPriceRange(model.price);
    if (!priceRange) return false;
    return selectedPriceRanges.has(priceRange);
  });

  models = models.filter((model) => {
    return shouldShowModel(
      model,
      rows.find((m) => m[0] == model.name && m[1] == paradigm)![2],
      modelMetadata[model.name],
      drop,
      models,
    );
  });

  return models;
}
