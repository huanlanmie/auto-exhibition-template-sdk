# Task A review fix — bounded Binary FBX preflight

Date: 2026-09-30. Source ownership returned to root after this report for independent Task B reviewer recheck. This is an implementation report, not self-approval.

Changed product source only:

`C:/Users/Administrator/Desktop/mju-smart-show/virtual-showroom-worker/src/converters/fbx.js`

No shared Worker files, dependencies, other converters, service code, source assets or published data were modified. The small unrelated Task C legacy compatibility review was recorded only in its review report.

## Verified defect

The pinned Three 0.186.1 FBXLoader binary parser reads arrayLength/encoding/compressedLength and calls unzlibSync before our former mesh checks. A small compressed payload could therefore expand without a decoded-byte budget. The previous GlobalSettings-only metadata walker did not inspect geometry arrays or their node/property boundaries.

## Implemented boundary

`preflightBinary` now traverses every binary node/property the pinned loader will read, before either FBXLoader.parse or any model materialization. It supports 32-bit headers and the 64-bit FBX >=7500 headers, with safe integer checks, forward/bounded absolute node end offsets, exact property-list byte consumption, known property types and exact child termination. Null records must have zero counts/length/name; top-level null records do not prematurely stop verification. The footer stopping formula matches the pinned loader.

The hard preflight caps are:

| Budget | Limit |
| --- | --- |
| Binary records, including null records | 20,000 |
| Binary nesting depth | 128 |
| Properties on one record | 1,024 |
| Total properties | 200,000 |
| Elements in one array | 10,000,000 |
| Total array elements | 20,000,000 |
| One expanded property / compressed array input | 32 MiB |
| Total expanded scalar/string/raw/array bytes | 64 MiB |
| Compressed input per streaming push | 256 bytes |
| Retained compressed input | 66,560 bytes |
| Retained streaming output window | 32,768 bytes |

Array element sizes are b/c=1, i/f=4, d/l=8. Only encoding 0/1 is allowed. Encoding 0 requires stored byte length to equal declared element count times width, within the current property list. Encoding 1 remains supported: its stored range is bounded and actual expansion must be verified as below. Node/property/expanded budgets are charged before decoding that property. Existing source input, post-loader geometry, browser deadline and output budgets remain in force.

## Compressed arrays remain supported

The adapter imports **the existing pinned** `Unzlib` from `three/addons/libs/fflate.module.js`; no dependency was added or installed.

It pushes at most 256 input bytes per call. The ondata callback retains no decoded chunks, counts actual bytes and throws immediately if output exceeds the already budgeted declared length. At the end actual length must equal declared length. In addition to the final callback, the fixed inflater state must have BFINAL and no unfinished Huffman tree (`s.f` / `s.l`); the callback's final flag alone merely echoes the caller. Only after the entire FBX preflight succeeds does FBXLoader perform its normal second parse/decompression over the same unchanged bytes.

Static evidence from the installed fixed implementation:

- `node_modules/three/examples/jsm/libs/fflate.module.js` Inflate constructor starts with a 32 KiB output window, not an array-length-derived allocation.
- `Inflate.e` appends only the supplied small chunk to pending input. The adapter additionally bounds `decoder.p` to prevent malformed/trailing bytes accumulating indefinitely.
- `Inflate.c` emits only new output and then slices retained output to the last 32 KiB and consumed input away. The adapter checks `decoder.o.length <= 32768` after every push.
- DEFLATE stored blocks have a 16-bit length; pending input can temporarily approach 65,535 bytes. Compressed match output is bounded by the bits in a small input slice and the fixed maximum match length, rather than the whole compressed array. The library may temporarily allocate/copy a chunk larger than its retained window (its cbuf uses growth/headroom); the listed rolling-window cap is **not** claimed as a process peak-memory cap. The binary budgets and browser process deadline remain separate limits.
- A preallocated-output unzlibSync return was deliberately not used as a length proof: the fixed implementation can return a clipped view. The streaming callback observes actual decoded length instead.

The use of `p/o/s` is intentionally coupled to the inspected Three 0.186.1 embedded fflate implementation and must be reviewed on dependency upgrade. There is no fallback to unbounded decompression when this check fails.

## Errors and reporting

- New fixed error: `FBX_BINARY_BUDGET` for record/depth/property/array/expanded-byte or streaming-window limits. Root must add a public fixed-message mapping.
- Existing `INVALID_FBX` for malformed offsets/property lengths/types/encoding, raw array size mismatch, corrupt/incomplete zlib stream or actual decoded length mismatch.
- `FBX_COMPRESSED_ARRAY_UNSUPPORTED` is **not** present in the final implementation; compressed binary FBX support is retained.
- Successful binary import reports `report.fbx.binaryPreflight` with observed counters, limits and compressionPolicy=`stream-verified-before-loader`.

## Verification and handoff

Executed `node --check src/converters/fbx.js`: exit 0. No functional test, model conversion, browser QA, build, startup, installation, staging or commit was run. This closes the implementation task only; independent review should examine all binary property cursor transitions, loader/preflight footer equivalence, fixed-stream state assumptions and actual-length accounting. Real compressed/uncompressed binary model compatibility remains manual acceptance work.
