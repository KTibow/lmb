<script lang="ts">
  import iconBack from "@ktibow/iconset-material-symbols/arrow-back-rounded";
  import { Button, Icon } from "m3-svelte";
  import { base } from "$app/paths";
  import Branding from "../Branding.svelte";
  import rowsRaw from "./data.jsonl?raw";
  import Markdown from "./Markdown.svelte";

  const rows = rowsRaw
    .split("\n")
    .filter(Boolean)
    .map((x) => JSON.parse(x));

  let gridView = $state(false);
</script>

<div class="header">
  <div class="hack">
    <Branding />
    <Button variant="filled" iconType="full" href="{base}/">
      <Icon icon={iconBack} />
    </Button>
  </div>
  <div class="center">Anonymous models</div>
</div>
<div class="models" class:grid-view={gridView}>
  {#each rows as { name, multimodal, context }}
    <div class="model">
      <h2>
        {name}
        {#if multimodal}
          (multimodal)
        {/if}
      </h2>
      <Markdown input={context} />
    </div>
  {/each}
  <input type="checkbox" bind:checked={gridView} id="grid-view" />
  <Button for="grid-view" variant="filled">Grid</Button>
</div>

<style>
  .header {
    display: grid;
    grid-template-columns: 8rem 1fr 8rem;
  }
  .hack {
    display: flex;
  }
  .center {
    place-self: center;
  }

  .models {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1.5rem;
    &.grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    }
  }
  .model {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.5rem;
    border-radius: 1.75rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));

    &:is(.grid-view .model) {
      max-height: 10rem;
      overflow: hidden;
    }
    &:not(.grid-view .model) {
      width: 100%;
      max-width: 50rem;
      align-self: center;
    }
  }
  h2 {
    font-weight: bold;
  }
  #grid-view {
    display: none;
  }
</style>
