export { D2ApiVersioned, D2ApiGeneric } from "./api/d2Api";
export { D2ApiMock, getMockApiFromClass } from "./testing";

export { HttpError } from "./repositories/HttpClientRepository";
export { Canceler, isCancel } from "./repositories/CancelableResponse";

export { CancelableResponse } from "./repositories/CancelableResponse";
export { Id, Ref, D2Geometry } from "./schemas";

// Re-export the current DHIS2 API version at package root for simpler imports.
export * from "./2.43";
