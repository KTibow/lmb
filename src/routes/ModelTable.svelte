<script lang="ts">
  import iconThink from "@ktibow/iconset-material-symbols/lightbulb-rounded";
  import iconNoThink from "@ktibow/iconset-material-symbols/light-off-rounded";
  import { Icon } from "m3-svelte";
  import { modelMetadata, type PriceRange } from "./model-metadata";
  import { filterModels, type ModelRaw } from "./model-filtering";
  import ScatterChart from "./ScatterChart.svelte";

  export let rows: [string, string, ModelRaw][];
  export let paradigm: string;
  export let categoryName: string;
  export let searches: string[];
  export let showOpenOnly = false;
  export let vizBorder;
  export let vizBar;
  export let dropDeprecated: boolean;
  export let dropSemidead: boolean;
  export let dropNonPareto: boolean;
  export let dropNonParetoOrg: boolean;
  export let dropNonParetoConservative: boolean;
  export let selectedPriceRanges: Set<PriceRange>;

  const newCutoff = Date.now() / 1000 - 60 * 60 * 24 * 7;

  $: models = filterModels(
    rows,
    paradigm,
    categoryName,
    searches,
    showOpenOnly,
    [
      dropDeprecated && "deprecated",
      dropSemidead && "semidead",
      dropNonPareto && "nonpareto",
      dropNonParetoOrg && "nonparetoorg",
      dropNonParetoConservative && "nonparetoconservative",
    ].filter((x): x is string => Boolean(x)),
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
      Google: "https://ai.google.dev/gemini-api/docs/models",
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

  function formatMD(m: number, d: number) {
    return `${m}/${d}`;
  }
  function formatYMD(y: number, m: number, d: number) {
    const thisYear = new Date().getFullYear();
    if (y == thisYear) {
      return formatMD(m, d);
    } else {
      return `${formatMD(m, d)} ${y}`;
    }
  }
  function formatM(m: number) {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
      m - 1
    ];
  }
  function formatMY(m: number, y: number) {
    const thisYear = new Date().getFullYear();
    if (y == thisYear) {
      return formatM(m);
    } else {
      return `${formatM(m)} ${y}`;
    }
  }
  function splitUp(name: string) {
    let pt2 = "";
    let pt3: { icon: any; text: string } | undefined;
    const extractThinking = () => {
      if (name.endsWith("-no-thinking")) {
        name = name.replace("-no-thinking", "");
        pt3 = { icon: iconNoThink, text: "No" };
      } else if (/-thinking-?([0-9]+k)?$/.test(name)) {
        const [, a, details] = name.match(/^(.+)-thinking-?([0-9]+k)?$/)!;
        name = a;
        pt3 = { icon: iconThink, text: details || "Yes" };
      }
    };
    extractThinking();
    if (/\d{4}-?[01]\d-?\d{2}/.test(name)) {
      const [match, y, m, d] = name.match(/(\d{4})-?(\d{2})-?(\d{2})/)!;
      name = name.replace(`-${match}`, "");
      pt2 = formatYMD(+y, +m, +d);
    } else if (/-[01]\d-\d{2}$/.test(name)) {
      const [, a, m, d] = name.match(/^(.+)-(\d{2})-(\d{2})$/)!;
      name = a;
      pt2 = formatMD(+m, +d);
    } else if (/-[01]\d\d{2}$/.test(name)) {
      const [, a, m, d] = name.match(/^(.+)-(\d{2})(\d{2})$/)!;
      name = a;
      pt2 = formatMD(+m, +d);
    } else if (/-[01]\d-\d{4}$/.test(name)) {
      const [, a, m, y] = name.match(/^(.+)-(\d{2})-(\d{4})$/)!;
      name = a;
      pt2 = formatMY(+m, +y);
    } else if (/-\d{4}[01]\d$/.test(name)) {
      const [, a, y, m] = name.match(/^(.+)-(\d{4})(\d{2})$/)!;
      name = a;
      pt2 = formatMY(+m, +y);
    } else if (/-\d{2}[01]\d$/.test(name)) {
      const [, a, y, m] = name.match(/^(.+)-(\d{2})(\d{2})$/)!;
      name = a;
      pt2 = formatMY(+m, +`20${y}`);
    } else if (/-\d{3}$/.test(name)) {
      const [, a, b] = name.match(/^(.+)-(\d{3})$/)!;
      name = a;
      pt2 = `v${+b}`;
    } else if (/^.+[0-9].+-v[0-9.]+$/.test(name)) {
      const [, a, b] = name.match(/^(.+)-v([0-9.]+)$/)!;
      name = a;
      pt2 = `v${+b}`;
    }
    extractThinking();
    return [name, pt2, pt3] as const;
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
    {#each models as { name, is_yupp, date, rating, rank, ciLow, ciHigh }, i (name)}
      {@const link = getModelLink(name)}
      {@const [pt1, pt2, thinking] = splitUp(name)}
      {#snippet text()}
        {pt1}
        {#if pt2}
          <span class="badge">{pt2}</span>
        {/if}
        {#if thinking}
          <span class="badge">
            <Icon icon={thinking.icon} />
            {thinking.text}
          </span>
        {/if}
        {#if is_yupp}
          <span class="badge" title="estimated based on other leaderboards">est</span>
        {/if}
        {#if date > newCutoff}
          <span class="badge new">new</span>
        {/if}
        {#if modelMetadata[name]?.isOpen}
          <span class="badge open">open</span>
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

<ScatterChart {models} unit={paradigm.includes("image") ? "generation" : "1M tokens (mixed)"} />

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
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
    vertical-align: middle;
    background-color: rgb(var(--m3-scheme-surface-container));
    &.new {
      background-color: rgb(var(--m3-scheme-primary));
      color: rgb(var(--m3-scheme-on-primary));
    }
    &.open {
      background-color: rgb(var(--m3-scheme-primary-container));
      color: rgb(var(--m3-scheme-on-primary-container));
    }
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
      background-color: rgb(var(--m3-scheme-primary) / 0.2);
      border-radius: 0.5rem;
      z-index: 1;
    }

    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: rgb(var(--m3-scheme-primary-container));
      border-radius: 0.5rem;
    }

    span {
      color: rgb(var(--m3-scheme-on-primary-container));
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
