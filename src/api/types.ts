import { HttpRequest, Agent } from "../repositories/HttpClientRepository";
import { D2ApiDefinitionBase } from "./common";
import { Model } from ".";

export interface D2ApiOptions {
    baseUrl?: string;
    apiVersion?: number;
    auth?: { username: string; password: string };
    backend?: "xhr" | "fetch";
    timeout?: number;
    agent?: Agent;
}

export type IndexedModels<D2ApiDefinition extends D2ApiDefinitionBase> = {
    [ModelKey in keyof D2ApiDefinition["schemas"]]: Model<
        D2ApiDefinition,
        D2ApiDefinition["schemas"][ModelKey]
    >;
};

export interface D2ApiRequest extends HttpRequest {
    skipApiPrefix?: boolean;
}
