import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../lib/slug";
test("slugify produces stable URL-safe slugs", () => { assert.equal(slugify("  My First Event!  "), "my-first-event"); assert.equal(slugify("Tech & Innovation 2026"), "tech-innovation-2026"); });
