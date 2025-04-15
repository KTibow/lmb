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
  select ~ :global(*) {
    border-left: 0.0625rem solid rgb(var(--m3-scheme-outline));
  }

  select {
    height: 100%;
    padding-left: 1rem;
    background-color: rgb(var(--m3-scheme-background));
  }
</style>
