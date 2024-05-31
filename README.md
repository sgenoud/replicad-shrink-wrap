# replicad shrink wrap

This is a library based on [replicad](https://replicad.xyz).

This library contains a set of helpers to shrink wrap a drawing. This
corresponds to the hull operation in some CAD software.

## As a library

This module can be used either as a library:

```js
pnpm install replicad-shrink-wrap
```

## Within the replicad studio

You can also import it within the [replicad studio][studio]:

```js
import shrinkWrap from "https://cdn.jsdelivr.net/npm/replicad-shrink-wrap/dist/studio/replicad-shrink-wrap.js";
/** @typedef { typeof import("replicad") } replicadLib */
/** @type {replicadLib} */
const { drawRoundedRectangle, drawCircle, draw } = replicad;

export default function main() {
  const circle = drawCircle(7).translate(8, 18);
  const rect = drawRoundedRectangle(20, 14, 5);

  return [
    { shape: rect, color: "silver" },
    { shape: circle, color: "silver" },
    shrinkWrap(rect.fuse(circle), 50),
  ];
}
```

[Go an play with it there][studio]

[studio]: https://studio.replicad.xyz/workbench#code=UEsDBAoAAAAIAAZuv1gAcNDMKAEAAA4CAAAHAAAAY29kZS5qc3WRP0%252FDMBDFd3%252BKU6akSuOCQFSNkJBYmbowIAZjX4jBsS370oKqfHec9B8g2M6%252B9373ztadd4EgtkHb98cgPDTBdZC1RD6uOJfKVm9RodGbUFkkbn3HA3qjpVDzvW2%252BTT6udCQeqVfa%252FSlImKxmfDaDO%252Fr0qLCBHYyVa0BPKfLs6MsKGOB4eNAvMONnJ%252By%252BdYaxJZ2NlGgqiO3a9VahWqMkYV8NltPtvQ7yWCf07QleM8bwY3qDlEj0hqDprSTtLHRC27yAHQPYT5ATJbnPyPymqCgIG40gzJclXCyL%252BmQIKcVB%252FjtXfrlI4qsSrpM%252BGQJSHyw8pRLSKrEVHlcToEww48IKsqjNBkMGQ%252FlTJQ%252Fb%252FaM7f24%252B8qqmj5jvPUWavyhG2XPNBvYFUEsBAhQACgAAAAgABm6%252FWABw0MwoAQAADgIAAAcAAAAAAAAAAAAAAAAAAAAAAGNvZGUuanNQSwUGAAAAAAEAAQA1AAAATQEAAAAA
