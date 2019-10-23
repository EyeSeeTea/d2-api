import Axios, { AxiosInstance, AxiosBasicCredentials, AxiosRequestConfig } from "axios";
import _ from "lodash";

import { D2ModelSchemas, D2ModelEnum } from "./../schemas/models";
import { joinPath, prepareConnection } from "../utils/connection";
import D2ApiMetadata from "./metadata";
import D2ApiModel from "./models";

import { Params, D2ApiResponse } from "./common";

export { D2ApiResponse };

export interface D2ApiOptions {
    baseUrl?: string;
    apiVersion?: number;
    auth?: AxiosBasicCredentials;
    alias?: string;
}

type Models = { [ModelName in keyof D2ModelSchemas]: D2ApiModel<ModelName> };

export default class D2Api {
    private static instances: D2Api[] = [];
    private apiPath: string;

    public readonly options: D2ApiOptions;
    public connection: AxiosInstance;
    public metadata: D2ApiMetadata;
    public models: Models;

    private constructor(options?: D2ApiOptions) {
        const {
            baseUrl = "http://localhost:8080",
            apiVersion,
            auth,
            alias = `d2-api-${D2Api.instances.length}`,
        } = options || {};
        this.apiPath = joinPath(baseUrl, "api", apiVersion ? String(apiVersion) : null);

        this.options = { ...options, baseUrl, alias };
        this.connection = prepareConnection(this.apiPath, auth);
        this.metadata = new D2ApiMetadata(this);
        this.models = _(Object.keys(D2ModelEnum))
            .map((modelName: keyof D2ModelSchemas) => [modelName, new D2ApiModel(this, modelName)])
            .fromPairs()
            .value() as Models;
    }

    public static createInstance(options?: D2ApiOptions): D2Api {
        const instance = new D2Api(options);
        D2Api.instances.push(instance);
        return instance;
    }

    public static getInstances(): D2Api[] {
        if (D2Api.instances.length === 0) {
            throw "D2Api has not been initialized yet, please make sure you have already called createInstance()";
        }
        return [...D2Api.instances];
    }

    public static getInstance(): D2Api {
        return D2Api.getInstances()[0];
    }

    public request<T>(config: AxiosRequestConfig): D2ApiResponse<T> {
        const { token: cancelToken, cancel } = Axios.CancelToken.source();
        const axiosResponse = this.connection({ cancelToken, ...config });
        const apiResponse = axiosResponse.then(response_ => ({
            status: response_.status,
            data: response_.data as T,
            headers: response_.headers,
        }));
        return { cancel, response: apiResponse };
    }

    public get<T>(url: string, params?: Params) {
        return this.request<T>({ method: "get", url, params });
    }

    public post<T>(url: string, params?: Params, data?: object) {
        return this.request<T>({ method: "post", url, params, data });
    }

    public put<T>(url: string, params?: Params, data?: object) {
        return this.request<T>({ method: "put", url, params, data });
    }

    public delete<T>(url: string, params?: Params) {
        return this.request<T>({ method: "delete", url, params });
    }
}
