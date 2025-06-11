import MockAdapter from "axios-mock-adapter";
import { CancelableResponse } from "./CancelableResponse";
import { PATToken } from "../api/types";

export interface HttpClientRepository {
    request<Data>(options: HttpRequest): CancelableResponse<Data>;
    getMockAdapter(): MockAdapter;
}

export type Method = "get" | "post" | "put" | "delete";

export type ParamValue = string | number | boolean | undefined;

export interface HttpRequest {
    method: Method;
    url: string;
    params?: Record<string, ParamValue | ParamValue[]>;
    data?: unknown;
    requestBodyType?: "json" | "raw";
    responseDataType?: "json" | "raw";
    validateStatus?(status: number): boolean;
    timeout?: number;
    headers?: Record<string, string>;
}

export interface HttpClientResponse<Data> {
    status: number;
    data: Data;
    headers: Record<string, string>;
}

export interface Credentials {
    username: string;
    password: string;
}

export interface ConstructorOptions {
    baseUrl?: string;
    auth?: Credentials;
    timeout?: number;
    agent?: Agent;
    personalToken?: PATToken;
}

export type Agent = unknown;

interface HttpErrorOptions {
    request: HttpRequest;
    response?: HttpClientResponse<unknown>;
}

export class HttpError extends Error implements HttpErrorOptions {
    request: HttpRequest;
    response?: HttpClientResponse<unknown>;

    constructor(message: string, obj: HttpErrorOptions) {
        super(message);
        this.request = obj.request;
        this.response = obj.response;
    }
}

export function getBody(dataType: HttpRequest["responseDataType"], data: any) {
    switch (dataType) {
        case "json": {
            return JSON.stringify(data);
        }
        default: {
            return data;
        }
    }
}
