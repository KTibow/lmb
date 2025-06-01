<script lang="ts">
  import {
    Chart,
    ScatterController,
    LinearScale,
    LogarithmicScale,
    PointElement,
    Tooltip,
  } from "chart.js";
  import type { Model } from "./model-filtering";
  import { modelMetadata, getPrice } from "./model-metadata";

  Chart.register(ScatterController, LinearScale, LogarithmicScale, PointElement, Tooltip);

  let { models, unit }: { models: Model[]; unit: string } = $props();

  let chart: Chart | undefined;

  function updateChart() {
    const ctx = document.getElementById("scatter-chart") as HTMLCanvasElement;
    if (!ctx) return;

    if (chart) {
      chart.destroy();
    }

    // Helper to get RGB values from CSS variable
    function getRGBValues(cssVar: string): string {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return style.getPropertyValue(cssVar).trim();
    }

    const textColor = `rgb(${getRGBValues("--m3-scheme-on-surface")})`;
    const primaryPointColor = `rgb(${getRGBValues("--m3-scheme-primary-container")})`;
    const primaryBorderColor = `rgb(${getRGBValues("--m3-scheme-on-primary-container")})`;
    const tertiaryPointColor = `rgb(${getRGBValues("--m3-scheme-tertiary-container")})`;
    const tertiaryBorderColor = `rgb(${getRGBValues("--m3-scheme-on-tertiary-container")})`;

    const dataPoints = models
      .map((model) => {
        const metadata = modelMetadata[model.name];
        const isOpen = metadata?.isOpen;
        const price = getPrice(model.name);
        return {
          x: price || 0,
          y: model.rating,
          label: model.name,
          backgroundColor: isOpen ? tertiaryPointColor : primaryPointColor,
          borderColor: isOpen ? tertiaryBorderColor : primaryBorderColor,
        };
      })
      .filter((point) => point.x > 0);

    chart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            data: dataPoints,
            backgroundColor: dataPoints.map((d) => d.backgroundColor),
            borderColor: dataPoints.map((d) => d.borderColor),
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const point = dataPoints[context.dataIndex];
                const price = point.x < 0.01 ? point.x.toFixed(3) : point.x.toFixed(2);
                return `${point.label}: $${price}/${unit}, Score: ${point.y.toFixed(1)}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "logarithmic",
            position: "bottom",
            title: {
              display: true,
              text: `$ per ${unit}`,
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: `rgb(var(--m3-scheme-on-surface-variant))`,
            },
          },
          y: {
            type: "linear",
            title: {
              display: true,
              text: "Arena Score",
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: `rgb(var(--m3-scheme-on-surface-variant))`,
            },
          },
        },
      },
    });
  }

  $effect(() => {
    if (models && window) setTimeout(updateChart, 0);
  });
  $effect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateChart);

    return () => {
      mediaQuery.removeEventListener("change", updateChart);
      if (chart) {
        chart.destroy();
      }
    };
  });
</script>

<div class="chart-container">
  <canvas id="scatter-chart"></canvas>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 400px;
    margin-top: 2rem;
    padding: 1rem;
    background-color: rgb(var(--m3-scheme-surface-container));
    border-radius: var(--m3-util-rounding-medium);
    box-shadow: var(--m3-util-elevation-1);
  }
  :global(.chartjs-tooltip) {
    background: rgb(var(--m3-scheme-surface-container-highest)) !important;
    color: rgb(var(--m3-scheme-on-surface)) !important;
    border: 1px solid rgb(var(--m3-scheme-outline)) !important;
  }
</style>
