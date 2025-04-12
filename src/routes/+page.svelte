<script lang="ts">
  import iconSearch from "@ktibow/iconset-material-symbols/search-rounded";
  import iconAdd from "@ktibow/iconset-material-symbols/add";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";
  import {
    SegmentedButtonContainer,
    SegmentedButtonItem,
    Button,
    Icon,
    Dialog,
    Switch,
  } from "m3-svelte";
  import { text as textBoard } from "./assets/results.json";
  import { vision as visionBoard } from "./assets/results.json";
  import { image as imageArenaBoard } from "./assets/results.json";
  import { default as imageArtificialBoard } from "./assets/image_artificial.json";
  import { default as imageFalBoard } from "./assets/image_fal.json";
  import { default as dates } from "./assets/dates.json";
  import ModelTable from "./ModelTable.svelte";
  import Dropdown from "./Dropdown.svelte";
  import {
    type FilterStrategy,
    type PriceRange,
    getFilterDescription,
    getPriceRangeLabel,
  } from "./model-metadata";
  import { browser } from "$app/environment";

  let paradigm = "text",
    category = "full",
    styleControl = true;
  let searches: string[] = [];
  let settingsOpen = false;
  let showOpenOnly = false;
  let vizBorder = false;
  let vizBar = false;
  let rankStrategy = "comparable";
  let filterStrategy: FilterStrategy = "hideDeprecated";
  let selectedPriceRanges = new Set<PriceRange>();

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
    vision: { Overall: "full", English: "english", Chinese: "chinese" },
    image_arena: {
      Overall: "full",
      "User prompts": "not_preset_generation",
      "Fixed prompts": "preset_generation",
    },
    image_artificial: {
      Overall: "full",
      ...Object.fromEntries(
        Object.keys(imageArtificialBoard)
          .filter((k) => k != "full")
          .map((k) => [k, k]),
      ),
    },
    image_fal: { Overall: "full" },
  } as Record<string, Record<string, string>>;

  const categoryName = (category: string, styleControl: boolean) =>
    `${category}${styleControl ? "_style_control" : ""}`;

  const normalizeStep = () => {
    if (!Object.values(categories[paradigm]).includes(category)) {
      category = "full";
    }

    const targetCategory = categoryName(category, styleControl);
    if (!(targetCategory in getCurrentBoard())) {
      styleControl = false;
    }
  };
  $: category, paradigm, styleControl, normalizeStep();

  function getCurrentBoard() {
    switch (paradigm) {
      case "text":
        return textBoard;
      case "vision":
        return visionBoard;
      case "image_arena":
        return imageArenaBoard;
      case "image_artificial":
        return imageArtificialBoard;
      case "image_fal":
        return imageFalBoard;
      default:
        return textBoard;
    }
  }

  $: if (browser) {
    if (localStorage["lmb-vizBorder"]) vizBorder = JSON.parse(localStorage["lmb-vizBorder"]);
    if (localStorage["lmb-vizBar"]) vizBar = JSON.parse(localStorage["lmb-vizBar"]);
    if (localStorage["lmb-styleControl"])
      styleControl = JSON.parse(localStorage["lmb-styleControl"]);
  }
  $: if (browser) localStorage["lmb-vizBorder"] = JSON.stringify(vizBorder);
  $: if (browser) localStorage["lmb-vizBar"] = JSON.stringify(vizBar);
  $: if (browser) localStorage["lmb-styleControl"] = JSON.stringify(styleControl);
</script>

<div class="search">
  <SegmentedButtonContainer>
    <Dropdown
      bind:value={paradigm}
      options={{
        Text: "text",
        Vision: "vision",
        "Image (LM Arena)": "image_arena",
        "Image (Artificial Analysis)": "image_artificial",
        "Image (Fal)": "image_fal",
      }}
    />
    {#if Object.keys(categories[paradigm]).length > 1}
      <Dropdown bind:value={category} options={categories[paradigm]} />
    {/if}
    {#if categoryName(category, true) in getCurrentBoard()}
      <input type="checkbox" bind:checked={styleControl} id="styleControl" />
      <SegmentedButtonItem input="styleControl">Style control</SegmentedButtonItem>
    {/if}
  </SegmentedButtonContainer>

  <div class="search-container">
    {#each searches as search, i}
      <div class="search-field">
        <Icon icon={iconSearch} />
        <input type="text" bind:value={searches[i]} placeholder="Search for a model" />
      </div>
    {/each}
    <Button type="text" iconType="full" on:click={() => (searches = [...searches, ""])}>
      <Icon icon={searches.length ? iconAdd : iconSearch} />
    </Button>
  </div>
  <Button type="text" iconType="full" on:click={() => (settingsOpen = true)}>
    <Icon icon={iconSettings} />
  </Button>
</div>

<ModelTable
  {paradigm}
  {dates}
  board={getCurrentBoard()}
  {category}
  {styleControl}
  {searches}
  {showOpenOnly}
  {vizBorder}
  {vizBar}
  {rankStrategy}
  {filterStrategy}
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
      <SegmentedButtonContainer>
        <input type="checkbox" bind:checked={vizBorder} id="vizBorder" />
        <SegmentedButtonItem input="vizBorder">With moats</SegmentedButtonItem>
        <input type="checkbox" bind:checked={vizBar} id="vizBar" />
        <SegmentedButtonItem input="vizBar">With charts</SegmentedButtonItem>
      </SegmentedButtonContainer>
    </div>

    <div class="filter-section">
      <span>Ranks are the same when</span>
      <SegmentedButtonContainer>
        <input
          type="radio"
          name="rankStrategy"
          bind:group={rankStrategy}
          value="comparable"
          id="comparable"
        />
        <SegmentedButtonItem input="comparable">~50% chance of losing</SegmentedButtonItem>
        <input
          type="radio"
          name="rankStrategy"
          bind:group={rankStrategy}
          value="league"
          id="league"
        />
        <SegmentedButtonItem input="league">~40% chance of losing</SegmentedButtonItem>
      </SegmentedButtonContainer>
    </div>

    <div class="filter-section">
      <span>Price ranges</span>
      <SegmentedButtonContainer>
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
          <SegmentedButtonItem input="price-{i}">
            {getPriceRangeLabel(range as PriceRange)}
          </SegmentedButtonItem>
        {/each}
      </SegmentedButtonContainer>
    </div>

    <div class="filter-section">
      <span>Drop similar models</span>
      <SegmentedButtonContainer>
        {#each ["showAll", "hideDeprecated", "hideOld", "onePerOrg"] as FilterStrategy[] as strategy}
          <input
            type="radio"
            name="filterStrategy"
            bind:group={filterStrategy}
            value={strategy}
            id={strategy}
          />
          <SegmentedButtonItem input={strategy}>
            {getFilterDescription(strategy)}
          </SegmentedButtonItem>
        {/each}
      </SegmentedButtonContainer>
    </div>
  </div>
  <svelte:fragment slot="buttons">
    <Button type="text" on:click={() => (settingsOpen = false)}>Done</Button>
  </svelte:fragment>
</Dialog>

<style>
  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 0;
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

  .search-container {
    display: flex;
    gap: 0.5rem;
    padding: 0;
    align-items: center;
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

  .search > :global(.m3-container.text) {
    background-color: rgb(var(--m3-scheme-surface-container));
  }
</style>
