import FormData from "form-data";
import { generateUid } from "../utils/uid";
import { Id, MetadataResponse } from "./base";
import { D2ApiResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";

export class Files {
    constructor(public d2Api: D2ApiGeneric) {}

    get(id: string): D2ApiResponse<Blob> {
        return this.d2Api.apiConnection.request<Blob>({
            method: "get",
            url: `/documents/${id}/data`,
            responseDataType: "raw",
        });
    }

    saveFileResource(params: Omit<FileUploadParameters, "id">): D2ApiResponse<string> {
        const { name, data } = params;

        const formData = new FormData();
        formData.append("file", data, name);
        formData.append("domain", "DOCUMENT");

        return this.d2Api.apiConnection
            .request<PartialSaveResponse>({
                method: "post",
                url: "/fileResources",
                data: formData,
                requestBodyType: "raw",
            })
            .map(({ data }) => {
                if (
                    !data.response ||
                    !data.response.fileResource ||
                    !data.response.fileResource.id
                ) {
                    throw new Error("Unable to store file, couldn't find resource");
                }

                return data.response.fileResource.id;
            });
    }

    upload(params: FileUploadParameters): D2ApiResponse<FileUploadResult> {
        const { id = generateUid(), name, data } = params;

        const formData = new FormData();
        formData.append("file", data, name);
        formData.append("domain", "DOCUMENT");

        return this.saveFileResource(params).flatMap(({ data: fileResourceId }) => {
            const document = { id, name, url: fileResourceId };

            return this.d2Api
                .post<MetadataResponse>("/metadata", {}, { documents: [document] })
                .map(({ data }) => ({ id, fileResourceId, response: data }));
        });
    }
}

export interface FileUploadParameters {
    id?: Id;
    name: string;
    data: Blob | Buffer; // Use Blob for browser, Buffer for node
    ignoreDocument?: boolean;
}

interface PartialSaveResponse {
    response?: {
        fileResource?: {
            id?: string;
        };
    };
}

export interface FileUploadResult {
    id: string;
    fileResourceId: string;
    response: MetadataResponse;
}
