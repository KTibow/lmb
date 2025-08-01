<script lang="ts">
  import iconSearch from "@ktibow/iconset-material-symbols/search-rounded";
  import iconAdd from "@ktibow/iconset-material-symbols/add";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";
  import { ConnectedButtons, Button, Icon, Dialog, Switch, Snackbar, Checkbox } from "m3-svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import rowsRaw from "./assets/data.jsonl?raw";
  import ModelTable from "./ModelTable.svelte";
  import Dropdown from "./Dropdown.svelte";
  import { type PriceRange, getPriceRangeLabel } from "./model-metadata";
  import Branding from "./Branding.svelte";

  const rows = rowsRaw
    .split("\n")
    .filter(Boolean)
    .map((x) => JSON.parse(x));

  let paradigm = "text",
    category = "full",
    styleControl = true;
  let searches: string[] = [];
  let settingsOpen = false;
  let showOpenOnly = false;
  let vizBorder = false;
  let vizBar = false;
  let dropDeprecated = true;
  let dropSemidead = false;
  let dropNonPareto = false;
  let dropNonParetoOrg = false;
  let dropNonParetoConservative = false;
  let selectedPriceRanges = new Set<PriceRange>();

  let snackbar: ReturnType<typeof Snackbar>;

  const getFullCategories = (paradigm: string) => {
    const example = rows.find((example) => example[1] == paradigm);
    if (!example) return [];
    return Object.keys(example[2].data);
  };

  const categories = {
    text: {
      Overall: "full",
      "Hard prompts": "hard_6",
      "Hard prompts (english)": "hard_english_6",
      "Longer query": "long_user",
      Multiturn: "multiturn",
      English: "english",
      Math: "math",
      "Instruction following": "if",
      "Creative writing": "creative_writing",
      Coding: "coding",
      Chinese: "chinese",
      French: "french",
      German: "german",
      Japanese: "japanese",
      Korean: "korean",
      Russian: "russian",
      Spanish: "spanish",
      "Exclude <5 tok query": "no_short",
      "Exclude refusal": "no_refusal",
    },
    lmarena_vision: { Overall: "full", English: "english", Chinese: "chinese" },
    lmarena_image: {
      Overall: "full",
      "User prompts": "not_preset_generation",
      "Fixed prompts": "is_preset_generation",
    },
    aa_image: {
      Overall: "full",
      ...Object.fromEntries(
        getFullCategories("aa_image")
          .filter((k) => k != "full")
          .map((k) => [k, k]),
      ),
    },
  } as Record<string, Record<string, string>>;
  $: paradigmCategories = Object.values(categories[paradigm]);
  $: paradigmCategoriesWithStyleControl = getFullCategories(paradigm);

  const categoryName = (category: string, styleControl: boolean) =>
    `${category}${styleControl ? "_style_control" : ""}`;

  const normalizeStep = () => {
    if (!paradigmCategories.includes(category)) {
      category = "full";
    }
  };
  $: category, paradigm, styleControl, normalizeStep();

  const share = () => {
    const settings = {
      paradigm,
      category,
      styleControl,
      searches,
      vizBorder,
      vizBar,
    };
    const settingsHash = JSON.stringify(settings);
    const url = `https://ktibow.github.io/lmb/#${settingsHash}`;
    navigator.clipboard.writeText(url).then(
      () => {
        snackbar.show({
          message: "Settings link copied",
          closable: true,
        });
      },
      () => {
        snackbar.show({
          message: "Failed to copy link",
          closable: true,
        });
      },
    );
  };

  if (browser) {
    if (localStorage["lmb-vizBorder"]) vizBorder = JSON.parse(localStorage["lmb-vizBorder"]);
    if (localStorage["lmb-vizBar"]) vizBar = JSON.parse(localStorage["lmb-vizBar"]);
    if (localStorage["lmb-styleControl"])
      styleControl = JSON.parse(localStorage["lmb-styleControl"]);

    const settingsHash = $page.url.hash;
    if (settingsHash) {
      const settings = JSON.parse(decodeURIComponent(settingsHash.slice(1)));
      if (settings.paradigm == "text") settings.paradigm = "text";
      if (settings.paradigm == "vision") settings.paradigm = "lmarena_vision";
      if (settings.paradigm == "image_arena") settings.paradigm = "lmarena_image";
      if (settings.paradigm == "image_aa") settings.paradigm = "aa_image";
      paradigm = settings.paradigm;
      category = settings.category;
      styleControl = Boolean(settings.styleControl);
      searches = settings.searches || [];
      vizBorder = Boolean(settings.vizBorder);
      vizBar = Boolean(settings.vizBar);
    }
  }
  $: if (browser) localStorage["lmb-vizBorder"] = JSON.stringify(vizBorder);
  $: if (browser) localStorage["lmb-vizBar"] = JSON.stringify(vizBar);
  $: if (browser) localStorage["lmb-styleControl"] = JSON.stringify(styleControl);
</script>

<div class="bar">
  <div class="branding-wrapper">
    <Branding />
  </div>
  <div class="search">
    <ConnectedButtons>
      <Dropdown
        bind:value={paradigm}
        options={{
          Text: "text",
          Vision: "lmarena_vision",
          "Image (LM Arena)": "lmarena_image",
          "Image (Artificial Analysis)": "aa_image",
        }}
      />
      {#if Object.keys(categories[paradigm]).length > 1}
        <Dropdown bind:value={category} options={categories[paradigm]} />
      {/if}
      {#if paradigmCategoriesWithStyleControl.includes(categoryName(category, true))}
        <input type="checkbox" bind:checked={styleControl} id="styleControl" />
        <Button for="styleControl" variant="filled" square>Style control</Button>
      {/if}
    </ConnectedButtons>

    <div class="search-container">
      {#each searches as search, i}
        <div class="search-field">
          <Icon icon={iconSearch} />
          <input type="text" bind:value={searches[i]} placeholder="Search for a model" />
        </div>
      {/each}
      <Button variant="text" iconType="full" onclick={() => (searches = [...searches, ""])}>
        <Icon icon={searches.length ? iconAdd : iconSearch} />
      </Button>
    </div>
    <Button variant="text" iconType="full" onclick={() => (settingsOpen = true)}>
      <Icon icon={iconSettings} />
    </Button>
  </div>
</div>

<ModelTable
  {rows}
  {paradigm}
  categoryName={paradigmCategoriesWithStyleControl.includes(categoryName(category, true))
    ? categoryName(category, styleControl)
    : category}
  {searches}
  {showOpenOnly}
  {vizBorder}
  {vizBar}
  {dropDeprecated}
  {dropSemidead}
  {dropNonPareto}
  {dropNonParetoOrg}
  {dropNonParetoConservative}
  {selectedPriceRanges}
/>

<Dialog bind:open={settingsOpen} headline="Settings">
  <div class="settings-content">
    <label>
      Open models only
      <Switch bind:checked={showOpenOnly} />
    </label>

    <div class="filter-section-inline">
      <span>Visualize scores</span>
      <ConnectedButtons>
        <input type="checkbox" bind:checked={vizBorder} id="vizBorder" />
        <Button variant="filled" square for="vizBorder">With moats</Button>
        <input type="checkbox" bind:checked={vizBar} id="vizBar" />
        <Button variant="filled" square for="vizBar">With charts</Button>
      </ConnectedButtons>
    </div>

    <div class="filter-section">
      <span>Price ranges</span>
      <ConnectedButtons>
        {#each ["$", "$$", "$$$", "$$$$"] as range, i}
          {@const isSelected = selectedPriceRanges.has(range as PriceRange)}
          <input
            type="checkbox"
            checked={isSelected}
            on:change={(e) => {
              if (e.currentTarget.checked) {
                selectedPriceRanges.add(range as PriceRange);
              } else {
                selectedPriceRanges.delete(range as PriceRange);
              }
              selectedPriceRanges = selectedPriceRanges;
            }}
            id="price-{i}"
          />
          <Button variant="filled" square for="price-{i}">
            {getPriceRangeLabel(range as PriceRange)}
          </Button>
        {/each}
      </ConnectedButtons>
    </div>

    <div class="filter-section">
      <span>Drop models</span>
      <div class="boxes">
        <label>
          <Checkbox>
            <input type="checkbox" bind:checked={dropDeprecated} />
          </Checkbox>
          Deprecated
        </label>
        <label>
          <Checkbox>
            <input type="checkbox" bind:checked={dropSemidead} />
          </Checkbox>
          Retired
        </label>
        <label>
          <Checkbox>
            <input type="checkbox" bind:checked={dropNonPareto} />
          </Checkbox>
          Non pareto
        </label>
        <label>
          <Checkbox>
            <input type="checkbox" bind:checked={dropNonParetoOrg} />
          </Checkbox>
          Non pareto (org specific)
        </label>
        <label>
          <Checkbox>
            <input type="checkbox" bind:checked={dropNonParetoConservative} />
          </Checkbox>
          Non pareto (conservative)
        </label>
      </div>
    </div>
    <p><em>Remember: You need a 70 point difference for a 60% win rate</em></p>
  </div>
  {#snippet buttons()}
    <Button variant="text" onclick={share}>Share</Button>
    <Button variant="tonal" onclick={() => (settingsOpen = false)}>Done</Button>
  {/snippet}
</Dialog>

<Snackbar bind:this={snackbar} />

<style>
  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .settings-content label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }

  .settings-content .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.375rem;

    span {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
    :global(label) {
      flex-grow: 1;
    }
  }
  .boxes {
    display: flex;
    flex-direction: column;
    label {
      display: flex;
      justify-content: start;
      height: 2.5rem;
    }
  }

  .settings-content .filter-section-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    span {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
    :global(label) {
      flex-grow: 1;
    }
  }

  .bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
  .branding-wrapper {
    display: flex;
  }
  .search {
    display: flex;
    gap: 0.5rem;
    height: 2.5rem;
    align-self: center;
    max-width: 100dvw;
  }
  .search > * {
    background-color: rgb(var(--m3-scheme-surface-container));
    padding: 0 1rem;
    border-radius: 1.25rem;
  }
  .search > :global(.m3-container.text) {
    background-color: rgb(var(--m3-scheme-surface-container)) !important;
  }

  .search-container {
    display: flex;
    gap: 0.5rem;
    padding: 0;
    overflow: hidden;
  }
  .search-field {
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    gap: 0.5rem;
    height: 100%;
    background: transparent;
  }
  .search-field :global(svg) {
    color: rgb(var(--m3-scheme-on-surface-variant));
  }
  .search-field input {
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
  }
</style>
