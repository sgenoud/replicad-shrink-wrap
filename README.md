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

You can also import it within the replicad studio

```js
import shrinkWrap from "https://cdn.jsdelivr.net/npm/replicad-shrink-wrap/dist/studio/replicad-shrink-wrap.js";

export default function main() {
  const baseShape = drawCircle(20).sketchOnPlane().extrude(52);
  return addVoronoi(baseShape, { faceIndex: 1, depth: -2 });
}
```
