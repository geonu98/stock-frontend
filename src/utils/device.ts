export const DEVICE_ID_KEY = "deviceId";

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceInfo() {
  return {
    deviceId: getOrCreateDeviceId(),
   deviceType: "WEB" as const, // web 으로 고정
  };
}
