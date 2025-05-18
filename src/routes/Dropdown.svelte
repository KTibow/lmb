<script lang="ts">
  export let value: string;
  export let options: Record<string, string>;
</script>

<select bind:value>
  {#each Object.entries(options) as [label, value]}
    <option {value}>{label}</option>
  {/each}
</select>

<style>
  select {
    height: 100%;
    padding-left: 1rem;
    border-radius: var(--m3-util-rounding-medium);
    background-color: rgb(var(--m3-scheme-surface-container));
  }
</style>
