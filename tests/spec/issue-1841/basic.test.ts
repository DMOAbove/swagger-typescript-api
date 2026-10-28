import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { generateApi } from "../../../src/index.js";

/**
 * Reproduces https://github.com/acacode/swagger-typescript-api/issues/1841
 *
 * `format: byte` is base64-encoded text, which JSON carries as a string (for example an
 * ASP.NET `byte[]` concurrency token). It was generated as `Blob`, so a value read from a
 * response could not be sent back in the next request without a cast. Raw bytes are
 * `format: binary`, which keeps its own mapping.
 */
describe("issue-1841", async () => {
  let tmpdir = "";

  beforeAll(async () => {
    tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "swagger-typescript-api"));
  });

  afterAll(async () => {
    await fs.rm(tmpdir, { recursive: true });
  });

  test("format byte is generated as string, format binary is unchanged", async () => {
    await generateApi({
      fileName: "schema",
      input: path.resolve(import.meta.dirname, "schema.json"),
      output: tmpdir,
      silent: true,
      generateClient: false,
    });

    const content = await fs.readFile(path.join(tmpdir, "schema.ts"), {
      encoding: "utf8",
    });

    expect(content).toMatch(/rowVersion:\s*string;/);
    expect(content).not.toMatch(/rowVersion:\s*Blob;/);
    expect(content).toMatch(/attachment\?:\s*File;/);
  });

  test("to match snapshot", async () => {
    await generateApi({
      fileName: "schema",
      input: path.resolve(import.meta.dirname, "schema.json"),
      output: tmpdir,
      silent: true,
      generateClient: false,
    });

    const content = await fs.readFile(path.join(tmpdir, "schema.ts"), {
      encoding: "utf8",
    });

    expect(content).toMatchSnapshot();
  });
});
