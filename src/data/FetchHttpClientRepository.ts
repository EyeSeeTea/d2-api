import MockAdapter from "axios-mock-adapter";
import btoa from "btoa";
import _ from "lodash";
import qs from "qs";

import {
    HttpClientRepository,
    Credentials,
    HttpRequest,
    HttpResponse,
    HttpError,
    ConstructorOptions,
} from "../repositories/HttpClientRepository";
import { CancelableResponse } from "../repositories/CancelableResponse";
import { joinPath } from "../utils/connection";

export class FetchHttpClientRepository implements HttpClientRepository {
    private baseUrl?: string;
    private auth?: Credentials;

    constructor(options: ConstructorOptions) {
        this.baseUrl = options.baseUrl || "";
        this.auth = options.auth;
    }

    request<Data>(options: HttpRequest): CancelableResponse<Data> {
        const controller = new AbortController();
        const { baseUrl, auth } = this;
        const { method, url, params, data, validateStatus = validateStatus2xx } = options;

        const baseHeaders: Record<string, string> = {
            Accept: "application/json, text/plain",
            ...(data ? { "Content-Type": "application/json;charset=UTF-8" } : {}),
        };

        const authHeaders: Record<string, string> = auth
            ? { Authorization: "Basic " + btoa(auth.username + ":" + auth.password) }
            : {};

        const fetchOptions: RequestInit = {
            method,
            signal: controller.signal,
            ...(data ? { body: JSON.stringify(data) } : {}),
            headers: { ...baseHeaders, ...authHeaders },
            credentials: auth ? "omit" : ("include" as const),
        };

        const fullUrl = joinPath(baseUrl, url) + getQueryStrings(params);

        const fetchResponse = fetch(fullUrl, fetchOptions);

        const response: Promise<HttpResponse<Data>> = fetchResponse.then(async res => {
            const dataIsJson = (res.headers.get("content-type") || "").includes("json");
            const data = (await (dataIsJson ? res.json() : res.text())) as Data;
            if (!validateStatus(res.status)) raiseHttpError(options, res, data);
            return { status: res.status, data: data, headers: getHeadersRecord(res.headers) };
        });

        return CancelableResponse.build({ response, cancel: () => controller.abort() });
    }

    getMockAdapter(): MockAdapter {
        throw new Error("Not implemented");
    }
}

type Value = string | number | boolean | undefined;

function getQueryStrings(params: Record<string, Value | Value[]> | undefined): string {
    if (_.isEmpty(params)) {
        return "";
    } else {
        return "?" + qs.stringify(params, { arrayFormat: "repeat" });
    }
}

function validateStatus2xx(status: number) {
    return status >= 200 && status < 300;
}

function raiseHttpError(request: HttpRequest, response: Response, body: unknown): Promise<void> {
    throw new HttpError(response.statusText, {
        request: request,
        response: {
            status: response.status,
            headers: getHeadersRecord(response.headers),
            data: body,
        },
    });
}

function getHeadersRecord(headers: Headers) {
    return headers ? _.fromPairs(Array.from(headers.entries())) : {};
}
