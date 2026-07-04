import {
  AppError,
  Roles,
  Status,
  assertDateRange,
  assertTariffWithinContract,
  findApprovalOverlap,
  requireRole,
  summarizeTariffs,
  validateTariffInput
} from "./domain.js";

import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.resolve(
  process.cwd(),
  "data",
  "database.json"
);

export function saveStore(store){
  if(
    !fs.existsSync(
      path.dirname(DB_PATH)
    )
  ){
    fs.mkdirSync(
      path.dirname(DB_PATH),
      {
        recursive:true
      }
    );
  }
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify(
      store,
      null,
      2
    )
  );
}

export function loadStore() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const store = JSON.parse(
        fs.readFileSync(
          DB_PATH,
          "utf8"
        )
      );
      if (
        store.users?.length
      ) {
        return store;
      }
    }
  }
  catch {
  }
  const seeded = createSeedStore();
  saveStore(seeded);
  return seeded;
}

export function createSeedStore() {
  return {
    users: [
    {
    id:"u_creator",
    name:"Creator Maya",
    password:"creator123",
    role:Roles.CREATOR
    },

    {
    id:"u_dual_source",
    name:"Creator Sam",
    password:"creator123",
    role:Roles.CREATOR
    },

    {
    id:"u_approver",
    name:"Approver Dev",
    password:"approver123",
    role:Roles.APPROVER
    },

    {
    id:"u_viewer",
    name:"Viewer Noor",
    password:"viewer123",
    role:Roles.VIEWER
    }

    ],
    contracts: [
      {
        id: "c_india_europe",
        name: "India-Europe Mainline 2026",
        description: "Annual mainline pricing for India-Europe import and export container moves.",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31"
      },
      {
        id: "c_asia_transship",
        name: "Asia Transshipment 2026",
        description: "Regional transshipment agreement covering hub moves across Asian ports.",
        valid_from: "2026-03-01",
        valid_until: "2026-11-30"
      },
      {
        id: "c_spot_q3",
        name: "Q3 Spot Capacity",
        description: "Short-term spot capacity contract for tactical Q3 tariff updates.",
        valid_from: "2026-07-01",
        valid_until: "2026-09-30"
      }
    ],
    tariffs: [
      {
        id: "t_approved_import",
        contract_id: "c_india_europe",
        container_size: "20FT",
        move_type: "IMPORT",
        currency: "USD",
        price: 1200,
        valid_from: "2026-01-01",
        valid_until: "2026-06-30",
        status: Status.APPROVED,
        creator_id: "u_creator",
        rejection_reason: ""
      },
      {
        id: "t_pending_export",
        contract_id: "c_india_europe",
        container_size: "40FT",
        move_type: "EXPORT",
        currency: "EUR",
        price: 1850,
        valid_from: "2026-07-01",
        valid_until: "2026-09-30",
        status: Status.PENDING,
        creator_id: "u_creator",
        rejection_reason: ""
      },
      {
        id: "t_draft_trans",
        contract_id: "c_asia_transship",
        container_size: "45FT",
        move_type: "TRANSSHIPMENT",
        currency: "USD",
        price: 900,
        valid_from: "2026-04-01",
        valid_until: "2026-08-31",
        status: Status.DRAFT,
        creator_id: "u_creator",
        rejection_reason: ""
      },
      {
        id: "t_rejected_import",
        contract_id: "c_spot_q3",
        container_size: "20FT",
        move_type: "IMPORT",
        currency: "INR",
        price: 64000,
        valid_from: "2026-07-15",
        valid_until: "2026-08-15",
        status: Status.REJECTED,
        creator_id: "u_creator",
        rejection_reason: "Price needs confirmation from finance."
      }
    ],
    nextTariffNumber: 100,
    nextContractNumber: 100
  };
}

export function getCurrentUser(store, userId) {
  return store.users.find((user) => user.id === userId);
}

export function listContracts(store, user) {
  if (user?.role === Roles.VIEWER) {
    return store.contracts
      .map((contract) => ({
        ...contract,
        tariffs: store.tariffs.filter((tariff) => tariff.contract_id === contract.id && tariff.status === Status.APPROVED)
      }))
      .filter((contract) => contract.tariffs.length > 0);
  }

  if (user?.role === Roles.CREATOR) {

    return store.contracts.map((contract) => ({

      ...contract,

      tariffs: store.tariffs.filter(

        tariff => tariff.contract_id === contract.id

      )

    }));

  }

  if (user?.role === Roles.APPROVER) {
    return store.contracts.map((contract) => ({
      ...contract,
      tariffs: store.tariffs.filter((tariff) => tariff.contract_id === contract.id && tariff.status === Status.PENDING)
    }));
  }

  return store.contracts.map((contract) => ({
    ...contract,
    tariffs: store.tariffs.filter((tariff) => tariff.contract_id === contract.id)
  }));
}

export function createContract(store, user, input) {
  requireRole(user, Roles.APPROVER);
  validateContractInput(input);
  const contract = {
    id: `c_${store.nextContractNumber++}`,
    name: input.name.trim(),
    description: input.description.trim(),
    valid_from: input.valid_from,
    valid_until: input.valid_until
  };
  store.contracts.push(contract);
  saveStore(store);
  return {
  ...contract,
  tariffs:[]
  };
}

export function deleteContract(store, user, contractId){
  requireRole(user,Roles.APPROVER)
  const index=
  store.contracts.findIndex(
  contract=>
  contract.id===contractId
  )
  if(index===-1){
  throw new AppError(
  404,
  "Contract not found."
  )
  }
  store.contracts.splice(
  index,
  1
  )
  store.tariffs=
  store.tariffs.filter(
  tariff=>
  tariff.contract_id!==contractId
  )
  saveStore(store);
  return true;

}

export function listTariffs(store, user, filters = {}) {
  let tariffs = [...store.tariffs];
  if (user?.role === Roles.CREATOR) {
    tariffs = tariffs.filter((tariff) => tariff.creator_id === user.id);
  }
  if (user?.role === Roles.VIEWER) {
    tariffs = tariffs.filter((tariff) => tariff.status === Status.APPROVED);
  }
  if (filters.status) {
    tariffs = tariffs.filter((tariff) => tariff.status === filters.status);
  }
  if (filters.contractId) {
    tariffs = tariffs.filter((tariff) => tariff.contract_id === filters.contractId);
  }
  return tariffs.map((tariff) => enrichTariff(store, tariff));
}

export function createTariff(store, user, contractId, input) {
  requireRole(user, Roles.CREATOR);
  const contract = findContract(store, contractId);
  validateTariffInput(input);
  assertTariffWithinContract(input, contract);

  const tariff = {
    id: `t_${store.nextTariffNumber++}`,
    contract_id: contractId,
    container_size: input.container_size,
    move_type: input.move_type,
    currency: input.currency,
    price: input.price,
    valid_from: input.valid_from,
    valid_until: input.valid_until,
    status: Status.DRAFT,
    creator_id: user.id,
    rejection_reason: ""
  };
  store.tariffs.push(tariff);
  saveStore(store);
  return enrichTariff(store, tariff);
}

export function updateTariff(store, user, tariffId, input) {
  requireRole(user, Roles.CREATOR);
  const tariff = findTariff(store, tariffId);
  if (tariff.creator_id !== user.id) {
    throw new AppError(403, "Creators can edit only their own tariffs.");
  }
  if (![Status.DRAFT, Status.REJECTED].includes(tariff.status)) {
    throw new AppError(409, "Only Draft or Rejected tariffs can be edited.");
  }
  const next = { ...tariff, ...input };
  validateTariffInput(next);
  assertTariffWithinContract(next, findContract(store, tariff.contract_id));
  Object.assign(tariff, {
    container_size: next.container_size,
    move_type: next.move_type,
    currency: next.currency,
    price: next.price,
    valid_from: next.valid_from,
    valid_until: next.valid_until,
    rejection_reason: ""
  });
  saveStore(store);
  return enrichTariff(store, tariff);
}

export function submitTariff(store, user, tariffId) {
  requireRole(user, Roles.CREATOR);
  const tariff = findTariff(store, tariffId);
  if (tariff.creator_id !== user.id) {
    throw new AppError(403, "Creators can submit only their own tariffs.");
  }
  if (![Status.DRAFT, Status.REJECTED].includes(tariff.status)) {
    throw new AppError(409, "Only Draft or Rejected tariffs can be submitted.");
  }
  assertTariffWithinContract(tariff, findContract(store, tariff.contract_id));
  tariff.status = Status.PENDING;
  tariff.rejection_reason = "";
  saveStore(store);
  return enrichTariff(store, tariff);
}

export function approveTariff(store, user, tariffId) {
  requireRole(user, Roles.APPROVER);
  const tariff = findTariff(store, tariffId);
  if (tariff.status !== Status.PENDING) {
    throw new AppError(409, "Only Pending tariffs can be approved.");
  }
  if (tariff.creator_id === user.id) {
    throw new AppError(403, "Approvers cannot approve their own tariff.");
  }
  assertTariffWithinContract(tariff, findContract(store, tariff.contract_id));
  const overlap = findApprovalOverlap(tariff, store.tariffs);
  if (overlap) {
    throw new AppError(409, `Approval blocked by overlapping approved tariff ${overlap.id}.`);
  }
  tariff.status = Status.APPROVED;
  tariff.rejection_reason = "";
  saveStore(store);
  return enrichTariff(store, tariff);
}

export function rejectTariff(store, user, tariffId, reason) {
  requireRole(user, Roles.APPROVER);
  const tariff = findTariff(store, tariffId);
  if (tariff.status !== Status.PENDING) {
    throw new AppError(409, "Only Pending tariffs can be rejected.");
  }
  if (!reason || !reason.trim()) {
    throw new AppError(400, "A rejection reason is required.");
  }
  tariff.status = Status.REJECTED;
  tariff.rejection_reason = reason.trim();
  saveStore(store);
  return enrichTariff(store, tariff);
}

export function getDashboard(store, user) {
  if (!user) {
    throw new AppError(401, "A valid x-user-id header is required.");
  }
  if (user.role === Roles.VIEWER) {
    return getViewerDashboard(store);
  }
  requireRole(user, Roles.APPROVER);
  return summarizeTariffs(store.tariffs);
}

export function getViewerDashboard(store) {
  const approvedTariffs = store.tariffs.filter((tariff) => tariff.status === Status.APPROVED);
  const activeContractIds = new Set(approvedTariffs.map((tariff) => tariff.contract_id));
  const currencySet = new Set(approvedTariffs.map((tariff) => tariff.currency));
  const totalPrice = approvedTariffs.reduce((sum, tariff) => sum + tariff.price, 0);
  const averagePrice = approvedTariffs.length ? totalPrice / approvedTariffs.length : 0;

  return {
    approvedTariffs: approvedTariffs.length,
    activeContracts: activeContractIds.size,
    currenciesUsed: currencySet.size,
    averagePrice,
    byMoveType: countApprovedBy(approvedTariffs, "move_type"),
    byCurrency: countApprovedBy(approvedTariffs, "currency"),
    byContainerSize: countApprovedBy(approvedTariffs, "container_size"),
    byContract: approvedTariffs.reduce((acc, tariff) => {
      const contract = store.contracts.find((item) => item.id === tariff.contract_id);
      const name = contract?.name ?? tariff.contract_id;
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {})
  };
}

function validateContractInput(input) {
  const name = input.name?.trim();
  const description = input.description?.trim();
  if (!name) throw new AppError(400, "Contract name is required.");
  if (!description) throw new AppError(400, "Contract description is required.");
  assertDateRange(input.valid_from, input.valid_until);
}

function countApprovedBy(tariffs, key) {
  return tariffs.reduce((acc, tariff) => {
    acc[tariff[key]] = (acc[tariff[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function findContract(store, contractId) {
  const contract = store.contracts.find((item) => item.id === contractId);
  if (!contract) throw new AppError(404, "Contract not found.");
  return contract;
}

function findTariff(store, tariffId) {
  const tariff = store.tariffs.find((item) => item.id === tariffId);
  if (!tariff) throw new AppError(404, "Tariff not found.");
  return tariff;
}

function enrichTariff(store, tariff) {
  return {
    ...tariff,
    contract: store.contracts.find((contract) => contract.id === tariff.contract_id),
    creator: store.users.find((user) => user.id === tariff.creator_id)
  };
}
