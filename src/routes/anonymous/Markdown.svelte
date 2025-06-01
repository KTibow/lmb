<script lang="ts">
  let {
    input,
  }: {
    input: string;
  } = $props();

  const TABLE_SEPARATOR = /^\|(?: ?:?-{3,}:? ?\|)+$/m;
  const escape = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sanitize = (text: string) => escape(text).replaceAll("&lt;br&gt;", "<br>");

  const chunk = (text: string) => {
    const chunks: string[] = [];
    for (const line of text.split("\n")) {
      let join = false;

      const lastChunk = chunks[chunks.length - 1];
      const spacing = line.match(/^ */)?.[0].length || 0;
      if (lastChunk) {
        const isUnclosedCode = (lastChunk.match(/```/g) || []).length == 1;
        if (isUnclosedCode) {
          join = true;
        }
        const isTableSeparator = TABLE_SEPARATOR.test(line);
        if (isTableSeparator) {
          join = true;
        }
        const wasTable = TABLE_SEPARATOR.test(lastChunk);
        const isTableRow = line.startsWith("| ") && line.endsWith("|");
        if (wasTable && isTableRow) {
          join = true;
        }
        const chunkSpacing = lastChunk.match(/^ */)?.[0].length || 0;
        if (spacing > 0 && spacing == chunkSpacing) {
          join = true;
        }
      }

      if (join) {
        chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}
${line}`;
        continue;
      }
      if (!line) continue;

      chunks.push(line);
    }
    return chunks;
  };
  const render = (chunk: string) => {
    const spacing = chunk.match(/^ */)?.[0] || "";
    if (spacing) {
      return `<div class="indent-${Math.floor(spacing.length / 2)}">${run(
        chunk.replace(new RegExp(`^${spacing}`, "gm"), ""),
      )}</div>`;
    }
    if (chunk.startsWith("> ")) {
      return `<blockquote>${run(chunk.slice(2))}</blockquote>`;
    }
    if (/^-{3,}$/.test(chunk)) {
      return `<div class="divider"></div>`;
    }
    if (/^(#+) (.+)$/.test(chunk)) {
      return chunk.replace(
        /^(#+) (.+)$/,
        (_, hashes, title) =>
          `<h${hashes.length}>${sanitize(title.replaceAll("**", ""))}</h${hashes.length}>`,
      );
    }
    // const imageRegex = /^!\[([^\]]*)\]\((\S+?)\)$/;
    // if (imageRegex.test(chunk)) {
    //   const [, alt, url] = chunk.match(imageRegex) as string[];
    //   return `<img src="${url}" alt="${alt}" />`;
    // }
    const listRegex = /^([-*•]|[0-9]+\.) (.+?)(?:: +(.+))?$/;
    const plainChunk = chunk.replaceAll("**", "").replace(/\*$/, "");
    if (listRegex.test(plainChunk)) {
      const [_, bullet, main, supporting] = plainChunk.match(listRegex) as string[];
      const number = bullet.endsWith(".") ? +bullet.slice(0, -1) : undefined;

      return (
        `<div class="list-item">` +
        (number ? `<div class="bullet">${number}</div>` : "") +
        run(main.trim()) +
        (supporting ? `<div class="supporting">${run(supporting.trim())}</div>` : "") +
        `</div>`
      );
    }
    if (TABLE_SEPARATOR.test(chunk)) {
      const grid = chunk
        .split("\n")
        .filter((line) => !TABLE_SEPARATOR.test(line))
        .map((line) => line.replace(/^\| /, "").replace(/\|$/, ""))
        .map((line) => line.split("| ").map((x) => x.trimEnd()));
      return `<table><tbody>
${grid
  .map(
    (row) => `<tr>
${row.map((c) => `<td>${run(c.replace(/ +<br> +/g, "\n"))}</td>`).join("")}
</tr>`,
  )
  .join("\n")}
</tbody></table>`;
    }

    let bits: { text: string; bold: boolean; italic: boolean; code: boolean }[] = [];

    const prepare = (regex: RegExp) => {
      const isEmoji = (char: string) => char.charCodeAt(0) > 0xff;
      const isText = (char: string) =>
        isEmoji(char) ||
        'abcdefghijklmonpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:!?$`"'.includes(char);
      const isStartText = (char: string) => "[(".includes(char);
      const isEndText = (char: string) => "]),".includes(char);
      const output: {
        lastDisabled: boolean;
        lastEmpty: boolean;
        lastText: boolean;
        nextText: boolean;
        bit: string;
      }[] = [];
      const estBits = chunk.split(regex).filter(Boolean);
      for (let i = 0; i < estBits.length; i++) {
        const lastChar = i == 0 ? "" : estBits[i - 1].at(-1)!;
        const nextChar = i == estBits.length - 1 ? "" : estBits[i + 1][0];
        output.push({
          lastDisabled: lastChar == "\\",
          lastEmpty: !lastChar || !isText(lastChar),
          lastText: isText(lastChar) || isEndText(lastChar),
          nextText: isText(nextChar) || isStartText(nextChar),
          bit: estBits[i],
        });
      }
      return output;
    };

    let boldOn = false;
    let italicOn = false;
    let codeOn = false;
    for (const { lastDisabled, lastEmpty, lastText, nextText, bit } of prepare(/(\*+|_|`)/g)) {
      const baseline = () => {
        if (lastDisabled) {
          bits[bits.length - 1].text = bits[bits.length - 1].text.replace(/\\$/, "");
          return false;
        }
        return true;
      };
      const baseline1 = () => {
        if (codeOn) {
          return false;
        }
        return baseline();
      };
      const baseline2 = () => {
        if (!codeOn) {
          return false;
        }
        return baseline();
      };
      if (bit == "`" && baseline2()) {
        codeOn = false;
        continue;
      }
      if (bit == "`" && baseline1()) {
        codeOn = true;
        continue;
      }
      if (bit == "***" && baseline1() && italicOn && boldOn && lastText) {
        italicOn = false;
        boldOn = false;
        continue;
      }
      if (bit == "***" && baseline1() && !italicOn && !boldOn && nextText) {
        italicOn = true;
        boldOn = true;
        continue;
      }
      if (bit == "**" && baseline1() && boldOn && lastText) {
        boldOn = false;
        continue;
      }
      if (bit == "**" && baseline1() && !boldOn && nextText) {
        boldOn = true;
        continue;
      }
      if (bit == "*" && baseline1() && italicOn && lastText) {
        italicOn = false;
        continue;
      }
      if (bit == "_" && baseline1() && italicOn && lastText) {
        italicOn = false;
        continue;
      }
      if (bit == "*" && baseline1() && !italicOn && nextText) {
        italicOn = true;
        continue;
      }
      if (bit == "_" && baseline1() && !italicOn && lastEmpty && nextText) {
        italicOn = true;
        continue;
      }
      bits.push({ text: bit, bold: boldOn, italic: italicOn, code: codeOn });
    }
    bits = bits.reduce(
      (mergedBits, bit) => {
        const prevBit = mergedBits[mergedBits.length - 1];
        if (
          prevBit &&
          prevBit.bold === bit.bold &&
          prevBit.italic === bit.italic &&
          prevBit.code === bit.code
        ) {
          prevBit.text += bit.text;
          return mergedBits;
        } else {
          return [...mergedBits, { ...bit }];
        }
      },
      [] as typeof bits,
    );

    return `<p>${bits
      .map((b) => {
        let text = sanitize(b.text);
        if (b.code) {
          text = `<code>${text}</code>`;
        }
        if (b.bold) {
          text = `<b>${text}</b>`;
        }
        if (b.italic) {
          text = `<i>${text}</i>`;
        }
        if (!b.code) {
          text = text.replace(
            /\[([^\]]+?)\]\(([^)]+?)\)|\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]\s]/g,
            (full, m1, m2) => {
              if (full.startsWith("[")) {
                return `<a href="${m2}" target="_blank">${m1}</a>`;
              } else {
                return `<a href="${full}" target="_blank">${full}</a>`;
              }
            },
          );
        }

        return text;
      })
      .join("")}</p>`;
  };

  const run = (input: string): string => {
    return chunk(input).map(render).join("\n");
  };
</script>

<div>
  {@html run(input)}
</div>

<style>
  div {
    display: flex;
    flex-direction: column;

    overflow: clip;
    overflow-clip-margin: 0.6rem;
    white-space: pre-wrap;

    min-height: 1.5rem;
    flex-shrink: 0;
  }

  div :global {
    > :not(:first-child, .divider + *) {
      margin-top: 0.5em;

      &:is(math) {
        display: block;
        display: math;
      }
    }

    p {
      white-space: pre-wrap;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-weight: 400;
    }

    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.1;
    }
    h2 {
      font-size: 2rem;
      line-height: 1.2;
    }
    h3 {
      font-size: 1.5rem;
      line-height: 1.3;
      opacity: 0.8;
    }
    h4 {
      font-size: 1.25rem;
      line-height: 1.4;
      opacity: 0.64;
    }
    h5 {
      opacity: 0.51;
    }
    h6 {
      opacity: 0.41;
    }

    .indent-1,
    .indent-2,
    .indent-3,
    .indent-4 {
      display: flex;
      flex-direction: column;
      margin-top: 0;
    }
    .indent-1 {
      margin-left: 1.6rem;
    }
    .indent-2 {
      margin-left: 3.2rem;
    }
    .indent-3 {
      margin-left: 4.8rem;
    }
    .indent-4 {
      margin-left: 6.4rem;
    }

    .list-item {
      display: grid;
      grid-template-columns: auto 1fr;
      padding: 0.75rem 0.25rem;
      margin-top: 0;

      .bullet {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.2rem;
        height: 1.5rem;
        border-radius: 0.6rem;
        background-color: rgb(var(--m3-scheme-primary-container));
        color: rgb(var(--m3-scheme-on-primary-container));
        font-size: 0.875rem;
        font-feature-settings: "tnum";

        grid-column: 1;
        grid-row: 1 / span 2;
        align-self: center;
        margin-left: -0.25rem;
        margin-right: 0.5rem;
      }
      p {
        grid-column: 2;
        grid-row: 1;
      }
      .supporting {
        display: flex;
        flex-direction: column;
        grid-column: 2;
        grid-row: 2;
        font-size: 0.875rem;
        color: rgb(var(--m3-scheme-on-surface-variant));
      }

      border-top: solid 1px rgb(var(--m3-scheme-surface-container-highest));
    }

    > .list-item:first-child,
    :is(p, h1, h2, h3) + .list-item,
    :is(p, h1, h2, h3) + div > .list-item:first-child {
      border-top: none;
    }

    .wikilink {
      color: rgb(var(--m3-scheme-primary));
    }

    table {
      border-spacing: 0;
    }
    td {
      background-color: rgb(var(--m3-scheme-surface-container));
      border-radius: 0.5rem;
      padding: 0.5rem;
      margin: 0;
    }

    .code-block {
      display: flex;
      flex-direction: column;
      background: rgb(var(--m3-scheme-surface-container));
      padding: 1rem;
      border-radius: 0.5rem;
      position: relative;

      pre {
        margin: 0;
        overflow-x: auto;
        font-size: 1rem;
      }

      .copy {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        inset: 0 0 0 auto;
        background: rgb(var(--m3-scheme-surface-container-highest));
        border-radius: 0.5rem;
        padding: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .copy {
        opacity: 1;
      }

      .copy :global(svg) {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    .divider {
      background-color: rgb(var(--m3-scheme-surface-container-highest));
      height: 2.25rem;
      margin: -0.125rem -0.6rem;
      flex-shrink: 0;
      position: relative;
      &::before,
      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        height: 1rem;
        background: rgb(var(--m3-scheme-background));
      }
      &::before {
        top: 0;
        border-radius: 0 0 1rem 1rem;
      }
      &::after {
        bottom: 0;
        border-radius: 1rem 1rem 0 0;
      }
    }

    a {
      color: rgb(var(--m3-scheme-primary));
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }

    img {
      max-width: 100%;
      height: 8rem;
      align-self: start;
      border-radius: 0.5rem;
    }
  }
</style>
