import axios, { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";
import qs from "qs";
import { CancelableResponse } from "../repositories/CancelableResponse";
import {
    ConstructorOptions,
    HttpClientRepository,
    HttpRequest,
    HttpClientResponse,
} from "../repositories/HttpClientRepository";

export class AxiosHttpClientRepository implements HttpClientRepository {
    private instance: AxiosInstance;

    constructor(options: ConstructorOptions) {
        this.instance = this.getAxiosInstance(options);
    }

    request<Data>(options: HttpRequest): CancelableResponse<Data> {
        const { token: cancelToken, cancel } = axios.CancelToken.source();

        const response: () => Promise<HttpClientResponse<Data>> = () => {
            const axiosResponse = this.instance({ ...options, cancelToken });
            return axiosResponse
                .then(res => ({
                    status: res.status,
                    data: res.data as Data,
                    headers: res.headers as HttpClientResponse<Data>["headers"],
                }))
                .catch(error => {
                    if (axios.isAxiosError(error)) {
                        const method = options.method;
                        const fullUrl = options.url;
                        const body = error.response ? error.response.data : undefined;
                        const msg = `[d2-api:request] ${method} ${fullUrl}`;
                        console.error(`${msg}\n${JSON.stringify(body, null, 4)}`);
                    } else {
                        console.error("Unexpected Error:", JSON.stringify(error));
                    }

                    throw error;
                });
        };

        return CancelableResponse.build({ cancel, response: response });
    }

    getMockAdapter(): MockAdapter {
        return new MockAdapter(this.instance);
    }

    private getAxiosInstance(options: ConstructorOptions) {
        return axios.create({
            baseURL: options.baseUrl,
            auth: options.auth,
            withCredentials: !options.auth,
            paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" }),
            validateStatus: status => status >= 200 && status < 300,
            timeout: options.timeout,
            httpAgent: options.agent,
            httpsAgent: options.agent,
        });
    }
}

// TODO: Wrap errors with HttpError (like backend fetch does)
