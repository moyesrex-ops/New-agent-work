#!/usr/bin/env python3
"""Generate CSS custom properties and a TypeScript module from tokens.json.

Run from the repo root: python3 design-tokens/build_tokens.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BANNER = "/* Generated from tokens.json by build_tokens.py. Do not edit. */"


def flatten(node, prefix=()):
    for key, value in node.items():
        if key.startswith("$"):
            continue
        path = prefix if key == "DEFAULT" else prefix + (key,)
        if isinstance(value, dict):
            yield from flatten(value, path)
        else:
            yield "-".join(path), value


def main():
    with open(os.path.join(HERE, "tokens.json")) as fh:
        tokens = json.load(fh)

    groups = [k for k in tokens if not k.startswith("$")]

    lines = [BANNER, ":root {"]
    flat = {}
    for group in groups:
        lines.append(f"  /* {group} */")
        for name, value in flatten({group: tokens[group]}):
            var = f"--{name}"
            lines.append(f"  {var}: {value};")
            flat[name] = value
        lines.append("")
    lines.append("}")

    with open(os.path.join(HERE, "tokens.css"), "w") as fh:
        fh.write("\n".join(lines) + "\n")

    ts = [
        BANNER.replace("/*", "//").replace("*/", "").rstrip(),
        "export const tokens = {",
    ]
    for name, value in flat.items():
        ts.append(f'  "{name}": "{value}",')
    ts += ["} as const;", "", "export type TokenName = keyof typeof tokens;", ""]

    with open(os.path.join(HERE, "tokens.ts"), "w") as fh:
        fh.write("\n".join(ts))

    print(f"generated {len(flat)} tokens -> tokens.css, tokens.ts")


if __name__ == "__main__":
    main()
