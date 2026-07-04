export const Roles = Object.freeze({
  CREATOR: "CREATOR",
  APPROVER: "APPROVER",
  VIEWER: "VIEWER"
});

export const Status = Object.freeze({
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
});

export const CONTAINER_SIZES = ["20FT", "40FT", "45FT"];
export const MOVE_TYPES = ["IMPORT", "EXPORT", "TRANSSHIPMENT"];
export const CURRENCIES = ["USD", "EUR", "INR"];

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireRole(user, role) {
  if (!user) {
    throw new AppError(401, "A valid x-user-id header is required.");
  }
  if (user.role !== role) {
    throw new AppError(403, `${user.role} is not allowed to perform this action.`);
  }
}

export function parseDate(value, fieldName) {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!value || Number.isNaN(timestamp)) {
    throw new AppError(400, `${fieldName} must be a valid ISO date.`);
  }
  return value;
}

function toTime(value) {
  return Date.parse(`${value}T00:00:00.000Z`);
}

export function assertDateRange(validFrom, validUntil) {
  parseDate(validFrom, "valid_from");
  parseDate(validUntil, "valid_until");
  if (toTime(validFrom) > toTime(validUntil)) {
    throw new AppError(400, "valid_from must be before or equal to valid_until.");
  }
}

export function assertTariffWithinContract(tariff, contract) {
  assertDateRange(tariff.valid_from, tariff.valid_until);
  if (toTime(tariff.valid_from) < toTime(contract.valid_from) || toTime(tariff.valid_until) > toTime(contract.valid_until)) {
    throw new AppError(400, "Tariff validity dates must lie within the parent contract validity period.");
  }
}

export function hasDateOverlap(candidate, existing) {
  return toTime(candidate.valid_from) <= toTime(existing.valid_until)
    && toTime(candidate.valid_until) >= toTime(existing.valid_from);
}

export function findApprovalOverlap(candidate, tariffs) {
  return tariffs.find((existing) => {
    if (existing.id === candidate.id || existing.status !== Status.APPROVED) return false;
    return existing.contract_id === candidate.contract_id
      && existing.container_size === candidate.container_size
      && existing.move_type === candidate.move_type
      && hasDateOverlap(candidate, existing);
  });
}

export function validateTariffInput(input) {
  const errors = [];
  if (!CONTAINER_SIZES.includes(input.container_size)) errors.push("container_size is invalid.");
  if (!MOVE_TYPES.includes(input.move_type)) errors.push("move_type is invalid.");
  if (!CURRENCIES.includes(input.currency)) errors.push("currency is invalid.");
  if (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price <= 0) {
    errors.push("price must be a positive number.");
  }
  assertDateRange(input.valid_from, input.valid_until);
  if (errors.length) {
    throw new AppError(400, errors.join(" "));
  }
}

export function summarizeTariffs(tariffs) {
  const byStatus = countBy(tariffs, "status");
  const byCurrency = countBy(tariffs, "currency");
  const byMoveType = countBy(tariffs, "move_type");
  for (const status of Object.values(Status)) byStatus[status] ??= 0;
  for (const currency of CURRENCIES) byCurrency[currency] ??= 0;
  for (const moveType of MOVE_TYPES) byMoveType[moveType] ??= 0;
  return { byStatus, byCurrency, byMoveType };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}
