import AbortController from "abort-controller";
import MockAdapter from "axios-mock-adapter";
import btoa from "btoa";
import iconv from "iconv-lite";
import "isomorphic-fetch";
import _ from "lodash";
import qs from "qs";
import { CancelableResponse } from "../repositories/CancelableResponse";
import {
    ConstructorOptions,
    getBody,
    HttpClientRepository,
    HttpError,
    HttpRequest,
    HttpResponse,
} from "../repositories/HttpClientRepository";
import { joinPath } from "../utils/connection";

export class FetchHttpClientRepository implements HttpClientRepository {
    constructor(public options: ConstructorOptions) {}

    request<Data>(options: HttpRequest): CancelableResponse<Data> {
        const controller = new AbortController();
        const { baseUrl = "", auth } = this.options;
        const timeout = options.timeout || this.options.timeout;
        const {
            method,
            url,
            params,
            data,
            dataType = "json",
            headers: extraHeaders = {},
            validateStatus = validateStatus2xx,
        } = options;

        const baseHeaders: Record<string, string> = {
            Accept: "application/json, text/plain",
            ...(data && dataType === "json"
                ? { "Content-Type": "application/json;charset=UTF-8" }
                : {}),
        };

        const authHeaders: Record<string, string> = auth
            ? { Authorization: "Basic " + btoa(auth.username + ":" + auth.password) }
            : {};

        const fetchOptions: RequestInit = {
            method,
            signal: controller.signal,
            body: getBody(dataType, data),
            headers: { ...baseHeaders, ...authHeaders, ...extraHeaders },
            credentials: auth ? "omit" : ("include" as const),
        };

        const fullUrl = joinPath(baseUrl, url) + getQueryStrings(params);

        // Fetch API has no timeout mechanism, implement with a setTimeout + controller.abort
        const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;
        const fetchResponse = fetch(fullUrl, fetchOptions);

        const response: Promise<HttpResponse<Data>> = fetchResponse
            .then(async res => {
                const headers = getHeadersRecord(res.headers);
                const data = await getResponseData(res, dataType);

                if (!validateStatus(res.status)) raiseHttpError(options, res, data);
                return { status: res.status, data: data as Data, headers };
            })
            .catch(error => {
                if (error.request) throw error;
                throw new HttpError(error.toString(), { request: options });
            })
            .finally(() => (timeoutId !== null ? clearTimeout(timeoutId) : null));

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
        request,
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

function getCharset(headers: _.Dictionary<string>): string {
    const contentType = headers["content-type"];
    if (!contentType) return "utf-8";

    const contentTypes = _.fromPairs(contentType.split(";").map(type => type.split("=")));
    return contentTypes["charset"] || "utf-8";
}

async function getResponseData(res: Response, type: HttpRequest["dataType"]): Promise<unknown> {
    if (type === "raw") {
        return res.blob();
    }

    const headers = getHeadersRecord(res.headers);
    const encoding = getCharset(headers);

    const arrayBuffer = await res.arrayBuffer();
    const content = iconv.decode(Buffer.from(arrayBuffer), encoding);

    if ((headers["content-type"] || "").includes("json")) {
        return JSON.parse(content);
    }

    return content;
}
