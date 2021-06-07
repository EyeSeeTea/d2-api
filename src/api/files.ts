import { generateUid } from "../utils/uid";
import { Id, MetadataResponse } from "./base";
import { D2ApiResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";

export interface FileUploadParameters {
    id?: Id;
    name: string;
    data: Blob;
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

export class Files {
    constructor(public d2Api: D2ApiGeneric) {}

    get(id: string): D2ApiResponse<Blob> {
        return this.d2Api.apiConnection.request<Blob>({
            method: "get",
            url: `/documents/${id}/data`,
            dataType: "raw",
        });
    }

    upload(params: FileUploadParameters): D2ApiResponse<FileUploadResult> {
        const { id = generateUid(), name, data } = params;

        const formData = new FormData();
        formData.append("file", data, name);
        formData.append("domain", "DOCUMENT");

        return this.d2Api.apiConnection
            .request<PartialSaveResponse>({
                method: "post",
                url: "/fileResources",
                data: formData,
                dataType: "raw",
            })
            .flatMap(({ data }) => {
                if (
                    !data.response ||
                    !data.response.fileResource ||
                    !data.response.fileResource.id
                ) {
                    throw new Error("Unable to store file, couldn't find resource");
                }

                const fileResourceId = data.response.fileResource.id;
                const document = { id, name, url: fileResourceId };

                return this.d2Api
                    .post<MetadataResponse>("/metadata", {}, { documents: [document] })
                    .map(({ data }) => ({ id, fileResourceId, response: data }));
            });
    }
}
