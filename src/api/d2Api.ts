import { AxiosHttpClientRepository } from "../data/AxiosHttpClientRepository";
import { FetchHttpClientRepository } from "../data/FetchHttpClientRepository";
import {
    HttpClientRepository,
    HttpRequest,
    HttpClientResponse,
} from "../repositories/HttpClientRepository";
import { D2SchemaProperties } from "../schemas";
import { cache, defineLazyCachedProperty } from "../utils/cache";
import { joinPath } from "../utils/connection";
import { Analytics } from "./analytics";
import { AppHub } from "./appHub";
import { Audit } from "./audit";
import { D2ApiDefinitionBase, D2ApiResponse, Params, HttpResponse } from "./common";
import { CurrentUser } from "./currentUser";
import { DataStore } from "./dataStore";
import { DataValues } from "./dataValues";
import { Email } from "./email";
import { Events } from "./events";
import { Expressions } from "./expressions";
import { Files } from "./files";
import { Maintenance } from "./maintenance";
import { MessageConversations } from "./messageConversations";
import { Metadata } from "./metadata";
import { Model } from "./model";
import { Sharing } from "./sharing";
import { SqlViews } from "./SqlViews";
import { System } from "./system";
import { TrackedEntityInstances } from "./trackedEntityInstances";
import { Tracker } from "./tracker";
import { D2ApiOptions, D2ApiRequest, IndexedModels } from "./types";
import { UserLookup } from "./UserLookup";

export class D2ApiGeneric {
    public baseUrl: string;
    public apiPath: string;
    baseConnection: HttpClientRepository;
    apiConnection: HttpClientRepository;

    public constructor(options?: D2ApiOptions) {
        const {
            baseUrl = "http://localhost:8080",
            apiVersion,
            auth,
            backend = "fetch",
            timeout,
            agent,
        } = options || {};
        this.baseUrl = baseUrl;
        this.apiPath = joinPath(baseUrl, "api", apiVersion ? String(apiVersion) : null);
        const HttpClientRepositoryImpl =
            backend === "fetch" ? FetchHttpClientRepository : AxiosHttpClientRepository;
        this.baseConnection = new HttpClientRepositoryImpl({ baseUrl, auth, timeout, agent });
        this.apiConnection = new HttpClientRepositoryImpl({
            baseUrl: this.apiPath,
            auth,
            timeout,
            agent,
        });
    }

    @cache()
    public getMockAdapter() {
        return this.apiConnection.getMockAdapter();
    }

    public request<T>(options: D2ApiRequest): D2ApiResponse<T> {
        const { skipApiPrefix = false, ...requestOptions } = options;
        const connection = skipApiPrefix ? this.baseConnection : this.apiConnection;
        return connection.request(requestOptions);
    }

    public get<T>(url: string, params?: Params) {
        return this.request<T>({ method: "get", url, params });
    }

    public post<T>(url: string, params?: Params, data?: object, request?: Partial<HttpRequest>) {
        return this.request<T>({ method: "post", url, params, data, ...request });
    }

    public put<T>(url: string, params?: Params, data?: object) {
        return this.request<T>({ method: "put", url, params, data });
    }

    public delete<T>(url: string, params?: Params) {
        return this.request<T>({ method: "delete", url, params });
    }

    async getVersion(): Promise<string> {
        const info = await this.get<{ version: string }>("/system/info").getData();
        return info.version;
    }
}

export abstract class D2ApiVersioned<
    D2ApiDefinition extends D2ApiDefinitionBase
> extends D2ApiGeneric {
    getIndexedModels(
        modelClass: any,
        modelKeys: Array<keyof D2ApiDefinition["schemas"]>
    ): IndexedModels<D2ApiDefinition> {
        const indexedModels: Partial<IndexedModels<D2ApiDefinition>> = {};
        modelKeys.forEach(key => {
            defineLazyCachedProperty(
                indexedModels,
                key,
                () => new modelClass(this, this.schemaModels[key])
            );
        });
        return indexedModels as IndexedModels<D2ApiDefinition>;
    }

    dataStore(namespace: string): DataStore {
        return new DataStore(this, "global", namespace);
    }

    userDataStore(namespace: string): DataStore {
        return new DataStore(this, "user", namespace);
    }

    constructor(
        private schemaModels: Record<keyof D2ApiDefinition["schemas"], D2SchemaProperties>,
        options?: D2ApiOptions
    ) {
        super(options);
    }

    get modelKeys(): Array<keyof D2ApiDefinition["schemas"]> | undefined {
        return this.schemaModels ? Object.keys(this.schemaModels) : undefined;
    }

    @cache()
    get metadata(): Metadata<D2ApiDefinition> {
        return new Metadata(this);
    }

    @cache()
    get models(): IndexedModels<D2ApiDefinition> {
        return this.getIndexedModels(Model, this.modelKeys || []);
    }

    @cache()
    get currentUser(): CurrentUser<D2ApiDefinition> {
        return new CurrentUser(this);
    }

    @cache()
    get analytics() {
        return new Analytics(this);
    }

    @cache()
    get dataValues() {
        return new DataValues(this);
    }

    @cache()
    get events() {
        return new Events(this);
    }

    @cache()
    get trackedEntityInstances() {
        return new TrackedEntityInstances(this);
    }

    @cache()
    get system() {
        return new System(this);
    }

    @cache()
    get sharing() {
        return new Sharing(this);
    }

    @cache()
    get messageConversations() {
        return new MessageConversations(this);
    }

    @cache()
    get email() {
        return new Email(this);
    }

    @cache()
    get files() {
        return new Files(this);
    }

    @cache()
    get appHub() {
        return new AppHub(this);
    }

    @cache()
    get maintenance() {
        return new Maintenance(this);
    }

    @cache()
    get expressions() {
        return new Expressions(this);
    }

    @cache()
    get audit() {
        return new Audit(this);
    }

    @cache()
    get sqlViews() {
        return new SqlViews(this);
    }

    @cache()
    get userLookup() {
        return new UserLookup(this);
    }

    @cache()
    get tracker() {
        return new Tracker(this);
    }
}

/* Starting at 2.38, some POST/PUT endpoints return a wrapped HTTP response.
 * See https://github.com/dhis2/dhis2-releases/blob/master/releases/2.38/README.md#api
 *
 * Instead of checking the API version, inspect the structure of the response.
 **/
export function unwrap<T>(res: HttpClientResponse<T | HttpResponse<T>>): T {
    const { data } = res;

    return typeof data === "object" && data && "httpStatus" in data && "response" in data
        ? (data as { response: T }).response
        : (data as T);
}

export { D2ApiOptions };
