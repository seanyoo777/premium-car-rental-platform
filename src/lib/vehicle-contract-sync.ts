import type { Contract, ContractStatus, Vehicle, VehicleStatus } from "./types";

const PIPELINE: ContractStatus[] = ["pending", "reviewing", "approved"];
const ACTIVE_LIKE: ContractStatus[] = ["active", "overdue"];
const TERMINAL: ContractStatus[] = ["completed", "cancelled"];

/**
 * 계약 목록만으로 차량 재고 상태를 산출합니다.
 * `hidden` / `maintenance` 는 자동 동기화 대상에서 제외합니다.
 */
export function resolveVehicleStatusFromContracts(
  vehicle: Vehicle,
  contracts: Contract[],
): VehicleStatus {
  if (vehicle.status === "hidden" || vehicle.status === "maintenance") {
    return vehicle.status;
  }
  const forVehicle = contracts.filter((c) => c.vehicleId === vehicle.id);
  if (forVehicle.some((c) => ACTIVE_LIKE.includes(c.status))) {
    return "contracted";
  }
  if (forVehicle.some((c) => PIPELINE.includes(c.status))) {
    return "reserved";
  }
  if (forVehicle.length === 0) {
    return "available";
  }
  if (forVehicle.every((c) => TERMINAL.includes(c.status))) {
    return "available";
  }
  return "available";
}

/** 모든 차량에 대해 계약 기반 상태를 재계산합니다. */
export function reconcileVehicleStatuses(
  vehicles: Vehicle[],
  contracts: Contract[],
): Vehicle[] {
  return vehicles.map((v) => ({
    ...v,
    status: resolveVehicleStatusFromContracts(v, contracts),
  }));
}
