<script lang="ts">
  import { modelMetadata, type FilterStrategy, type PriceRange } from "./model-metadata";
  import { filterModels } from "./model-filtering";
  import ScatterChart from "./ScatterChart.svelte";

  export let paradigm: string;
  export let dates: Record<string, number>;
  export let board: Record<string, Record<string, any>>;
  export let category: string;
  export let styleControl: boolean;
  export let searches: string[];
  export let showOpenOnly = false;
  export let vizBorder = false;
  export let vizBar = false;
  export let rankStrategy: string;
  export let filterStrategy: FilterStrategy;
  export let selectedPriceRanges: Set<PriceRange>;

  const newCutoff = Math.max(Date.now() / 1000 - 60 * 60 * 24 * 7, 1744493596); // in the future we can remove this

  $: categoryName = `${category}${styleControl ? "_style_control" : ""}`;
  $: models = filterModels(
    board,
    categoryName,
    searches,
    showOpenOnly,
    rankStrategy,
    filterStrategy,
    selectedPriceRanges,
  );
  $: anyCi = models.some((m) => m.ciLow !== m.ciHigh);
  $: maxRating = Math.max(...models.map((m) => m.ciHigh));

  function formatCI(rating: number, low: number, high: number): string {
    const minus = Math.round(rating - low);
    const plus = Math.round(high - rating);
    return `+${plus}/-${minus}`;
  }

  function getModelLink(name: string) {
    const metadata = modelMetadata[name];

    if (metadata?.isOpen) {
      return `https://huggingface.co/models?search=${encodeURIComponent(name)}`;
    }

    const orgToUrl: Record<string, string> = {
      OpenAI: "https://platform.openai.com/docs/models/",
      Amazon: "https://docs.aws.amazon.com/nova/latest/userguide/what-is-nova.html",
      Anthropic: "https://www.anthropic.com/claude",
      Google: "https://ai.google.dev/models/",
      Deepseek: "https://www.deepseek.com/",
      Meta: "https://ai.meta.com/llama/",
      Mistral: "https://mistral.ai/",
      Qwen: "https://huggingface.co/Qwen/",
      xAI: "https://x.ai/",
      "01": "https://www.01.ai/",
      "Black Forest Labs": "https://blackforestlabs.ai/",
      "Reka AI": "https://www.reka.ai/ourmodels",
      Stability: "https://platform.stability.ai/",
    };

    if (metadata?.organization && metadata.organization in orgToUrl) {
      return orgToUrl[metadata.organization];
    }

    return undefined;
  }
</script>

<table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Model</th>
      <th>Rating</th>
      {#if anyCi}
        <th>95% CI</th>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each models as { name, rating, rank, ciLow, ciHigh }, i (name)}
      {@const link = getModelLink(name)}
      {#snippet text()}
        {name}
        {#if modelMetadata[name]?.isOpen}
          <span class="badge">open</span>
        {/if}
        {#if dates[name] > newCutoff}
          <span class="badge">new</span>
        {/if}
      {/snippet}
      <tr
        class:short={vizBorder}
        style:--padding={vizBorder && i > 0
          ? `${2 * Math.min(Math.max(models[i - 1].rating - rating, 0), 300) + 1}px`
          : "1px"}
      >
        <td>{rank}</td>
        <td>
          {#if link}
            <a href={link} target="_blank" rel="noopener noreferrer">
              {@render text()}
            </a>
          {:else}
            {@render text()}
          {/if}
        </td>
        <td>
          {#if vizBar}
            {@const pct1 = Math.max((ciLow - 1000) / (maxRating - 1000), 0) * 100}
            {@const pct2 = Math.max((rating - 1000) / (maxRating - 1000), 0) * 100}
            {@const pct3 = Math.max((ciHigh - 1000) / (maxRating - 1000), 0) * 100}
            <div class="viz-bar">
              <div class="shadow" style:left="{pct1}%" style:right="{100 - pct3}%"></div>
              <div class="bar" style:left="0%" style:width="{pct2}%"></div>
              <span>{Math.round(rating)}</span>
            </div>
          {:else}
            {Math.round(rating)}
          {/if}
        </td>
        {#if anyCi}
          <td>{formatCI(rating, ciLow, ciHigh)}</td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>

<ScatterChart {models} unit={paradigm.startsWith("image") ? "generation" : "1M tokens (mixed)"} />

<style>
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 1rem;
  }

  th,
  td {
    padding: 0.5rem;
    text-align: left;
  }

  th {
    font-weight: bold;
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  td {
    border-top: var(--padding) solid rgb(var(--m3-scheme-outline-variant));
    transition: border-top-width 200ms;
  }

  td,
  th {
    font-variant-numeric: tabular-nums;
  }

  a {
    color: rgb(var(--m3-scheme-primary));
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 1rem;
    background-color: rgb(var(--m3-scheme-tertiary-container));
    color: rgb(var(--m3-scheme-on-tertiary-container));
    margin-left: 0.5rem;
    vertical-align: middle;
  }

  .viz-bar {
    display: flex;
    align-items: center;
    width: 60dvw;
    height: 2rem;

    position: relative;

    .shadow {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: rgb(var(--m3-scheme-secondary) / 0.2);
      border-radius: 0.5rem;
    }

    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: rgb(var(--m3-scheme-secondary) / 0.8);
      border-radius: 0.5rem;
    }

    span {
      color: rgb(var(--m3-scheme-on-secondary));
      padding-left: 0.5rem;
      z-index: 1;
    }
  }
  .short td {
    padding: 0.25rem 0.5rem;
  }
  .short .viz-bar {
    height: 1.5rem;
  }
</style>
