import test from "node:test";
import assert from "node:assert/strict";
import { bodyDeleteVerdict } from "../src/lib/teamRoles";

const limited = { noDelete: true };

test("a no-delete member can still take someone off a pipeline", () => {
  assert.equal(bodyDeleteVerdict(limited, { action: "delete", cardId: "c1" }, "/api/dm-pipeline").allow, true);
  assert.equal(bodyDeleteVerdict(limited, { action: "remove-from-pipeline", boardId: "b1", name: "Pat" }, "/api/qualifier").allow, true);
});

test("a no-delete member still cannot delete anything else", () => {
  assert.equal(bodyDeleteVerdict(limited, { action: "delete", cardId: "c1" }, "/api/contacts").allow, false);
  assert.equal(bodyDeleteVerdict(limited, { action: "board-delete", boardId: "b1" }, "/api/dm-pipeline").allow, false);
  assert.equal(bodyDeleteVerdict(limited, { action: "stage-delete", stageId: "s1" }, "/api/dm-pipeline").allow, false);
  assert.equal(bodyDeleteVerdict(limited, { action: "audience-delete", id: "a1" }, "/api/qualifier").allow, false);
  assert.equal(bodyDeleteVerdict(limited, { action: "delete" }).allow, false);
});

test("a member without the limit is unaffected", () => {
  assert.equal(bodyDeleteVerdict({}, { action: "board-delete" }, "/api/dm-pipeline").allow, true);
});
