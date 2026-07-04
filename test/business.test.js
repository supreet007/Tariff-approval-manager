import test from "node:test";
import assert from "node:assert/strict";
import {
  approveTariff,
  createSeedStore,
  createTariff,
  getDashboard,
  listContracts,
  submitTariff,
  updateTariff
} from "../src/store.js";

function user(store, id) {
  return store.users.find((item) => item.id === id);
}

test("approval rejects overlapping approved tariff, including shared boundary date", () => {
  const store = createSeedStore();
  const creator = user(store, "u_creator");
  const approver = user(store, "u_approver");

  const created = createTariff(store, creator, "c_india_europe", {
    container_size: "20FT",
    move_type: "IMPORT",
    currency: "EUR",
    price: 1300,
    valid_from: "2026-06-30",
    valid_until: "2026-08-31"
  });
  submitTariff(store, creator, created.id);

  assert.throws(
    () => approveTariff(store, approver, created.id),
    /overlapping approved tariff/
  );
});

test("approval allows same contract and move type when dates do not overlap", () => {
  const store = createSeedStore();
  const creator = user(store, "u_creator");
  const approver = user(store, "u_approver");

  const created = createTariff(store, creator, "c_india_europe", {
    container_size: "20FT",
    move_type: "IMPORT",
    currency: "USD",
    price: 1400,
    valid_from: "2026-07-01",
    valid_until: "2026-12-31"
  });
  submitTariff(store, creator, created.id);
  const approved = approveTariff(store, approver, created.id);

  assert.equal(approved.status, "APPROVED");
});

test("creator and viewer cannot access approver dashboard", () => {
  const store = createSeedStore();

  assert.throws(
    () => getDashboard(store, user(store, "u_creator")),
    /not allowed/
  );
  assert.throws(
    () => getDashboard(store, user(store, "u_viewer")),
    /not allowed/
  );
  assert.doesNotThrow(() => getDashboard(store, user(store, "u_approver")));
});

test("creator cannot approve tariff", () => {
  const store = createSeedStore();

  assert.throws(
    () => approveTariff(store, user(store, "u_creator"), "t_pending_export"),
    /not allowed/
  );
});

test("approver cannot modify tariff values", () => {
  const store = createSeedStore();

  assert.throws(
    () => updateTariff(store, user(store, "u_approver"), "t_pending_export", { price: 1 }),
    /not allowed/
  );
});

test("approver cannot approve their own tariff", () => {
  const store = createSeedStore();
  store.tariffs.push({
    id: "t_self_review",
    contract_id: "c_spot_q3",
    container_size: "45FT",
    move_type: "EXPORT",
    currency: "USD",
    price: 2000,
    valid_from: "2026-07-01",
    valid_until: "2026-07-31",
    status: "PENDING",
    creator_id: "u_approver",
    rejection_reason: ""
  });

  assert.throws(
    () => approveTariff(store, user(store, "u_approver"), "t_self_review"),
    /cannot approve their own tariff/
  );
});

test("viewer sees only contracts that contain approved tariffs", () => {
  const store = createSeedStore();
  const contracts = listContracts(store, user(store, "u_viewer"));

  assert.equal(contracts.length, 1);
  assert.equal(contracts[0].id, "c_india_europe");
  assert.deepEqual(
    contracts[0].tariffs.map((tariff) => tariff.status),
    ["APPROVED"]
  );
});

test("contract tariff counts are role-aware", () => {
  const store = createSeedStore();

  const creatorContracts = listContracts(store, user(store, "u_creator"));
  const approverContracts = listContracts(store, user(store, "u_approver"));
  const viewerContracts = listContracts(store, user(store, "u_viewer"));

  assert.equal(
    creatorContracts.find((contract) => contract.id === "c_india_europe").tariffs.length,
    2
  );
  assert.equal(
    approverContracts.find((contract) => contract.id === "c_india_europe").tariffs.length,
    1
  );
  assert.equal(
    approverContracts.find((contract) => contract.id === "c_asia_transship").tariffs.length,
    0
  );
  assert.equal(
    viewerContracts.find((contract) => contract.id === "c_india_europe").tariffs.length,
    1
  );
});
