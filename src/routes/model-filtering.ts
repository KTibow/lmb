import {
  type FilterStrategy,
  type PriceRange,
  type ModelMetadata,
  modelMetadata,
  getPriceRange,
} from "./model-metadata";

function shouldShowModel(
  model: string,
  metadata: ModelMetadata,
  strategy: FilterStrategy,
  allModels: Array<{ name: string; rating: number }>,
): boolean {
  switch (strategy) {
    case "showAll":
      return true;
    case "hideDeprecated":
      return !metadata.deprecated;
    case "hideOld": {
      if (metadata.deprecated) return false;
      if (!metadata.organization || !metadata.price) return true;

      const thisModelScore = allModels.find((m) => m.name === model)?.rating;
      if (!thisModelScore) return true;

      const price = metadata.price;
      const org = metadata.organization;
      return !allModels.some((other) => {
        const otherMeta = modelMetadata[other.name];
        if (otherMeta && otherMeta.organization == org && otherMeta.price) {
          return other.rating > thisModelScore && otherMeta.price <= price;
        }
        return false;
      });
    }
    case "onePerOrg":
      if (!metadata.organization) return true;
      const orgModels = allModels.filter(
        (m) => modelMetadata[m.name]?.organization === metadata.organization,
      );
      const bestOrgModel = orgModels.reduce((best, current) =>
        current.rating > best.rating ? current : best,
      );
      return bestOrgModel.name === model;
  }
}

export interface ModelData {
  name: string;
  rating: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
}

export function filterModels(
  board: Record<string, Record<string, any>>,
  categoryName: string,
  searches: string[],
  showOpenOnly: boolean,
  filterStrategy: FilterStrategy,
  selectedPriceRanges: Set<PriceRange>,
): ModelData[] {
  let models: ModelData[] = [];

  // Build initial model data
  for (const [name, rating] of Object.entries(board[categoryName]?.elo_rating_final || {})) {
    const ci = board[categoryName]?.confidence_intervals?.[name] || {};

    models.push({
      name,
      rating: Number(rating),
      ciLow: Number(ci.low) || Number(rating),
      ciHigh: Number(ci.high) || Number(rating),
      rank: 0,
    });
  }

  // Sort and assign ranks
  models.sort((a, b) => b.rating - a.rating);
  let rank = 1;
  let nextRank = 1;
  let bar: number | undefined;
  for (const model of models) {
    let thisBar;
    let thisScore;
    thisBar = model.ciLow;
    thisScore = model.ciHigh;

    const metadata = modelMetadata[model.name];
    const isFilteredOut =
      filterStrategy == "showAll"
        ? false
        : filterStrategy == "hideDeprecated"
          ? metadata && !shouldShowModel(model.name, metadata, filterStrategy, models)
          : !metadata || !shouldShowModel(model.name, metadata, filterStrategy, models);
    if (!isFilteredOut) {
      if (!bar) {
        bar = thisBar;
      }
      if (thisScore < bar) {
        bar = thisBar;
        rank = nextRank;
      }
      nextRank++;
    }
    model.rank = rank;
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
    const metadata = modelMetadata[model.name];
    const avgPrice = metadata?.price;
    const priceRange = avgPrice && getPriceRange(avgPrice);
    if (!priceRange) return false;
    return selectedPriceRanges.has(priceRange);
  });

  if (filterStrategy != "showAll") {
    models = models.filter((model) => {
      const metadata = modelMetadata[model.name];
      return !metadata || shouldShowModel(model.name, metadata, filterStrategy, models);
    });
  }

  return models;
}
