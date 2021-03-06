import { D2ApiGeneric } from "./d2Api";
import { D2ApiResponse } from "./common";

/* https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/maintenance.html */

export class Maintenance {
    constructor(public d2Api: D2ApiGeneric) {}

    analyticsTablesClear(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/analyticsTablesClear");
    }

    analyticsTablesAnalyze(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/analyticsTablesAnalyze");
    }

    expiredInvitationsClear(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/expiredInvitationsClear");
    }

    periodPruning(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/periodPruning");
    }

    zeroDataValueRemoval(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/zeroDataValueRemoval");
    }

    softDeletedDataValueRemoval(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/softDeletedDataValueRemoval");
    }

    softDeletedProgramStageInstanceRemoval(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/softDeletedProgramStageInstanceRemoval");
    }

    softDeletedProgramInstanceRemoval(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/softDeletedProgramInstanceRemoval");
    }

    softDeletedTrackedEntityInstanceRemoval(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/softDeletedTrackedEntityInstanceRemoval");
    }

    sqlViewsDrop(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/sqlViewsDrop");
    }

    sqlViewsCreate(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/sqlViewsCreate");
    }

    categoryOptionComboUpdate(options: { categoryComboId?: string } = {}): D2ApiResponse<void> {
        const { categoryComboId } = options;
        const extraPath = categoryComboId ? `/categoryCombo/${categoryComboId}` : "";
        return this.d2Api.post<void>("/maintenance/categoryOptionComboUpdate" + extraPath);
    }

    cacheClear(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/cacheClear");
    }

    ouPathsUpdate(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/ouPathsUpdate");
    }

    dataPruningOrganisationUnit(id: string): D2ApiResponse<void> {
        return this.d2Api.post<void>(`/maintenance/dataPruning/organisationUnits/${id}`);
    }

    dataPruningDataElement(id: string): D2ApiResponse<void> {
        return this.d2Api.post<void>(`/maintenance/dataPruning/dataElements/${id}`);
    }

    metadataValidation(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/metadataValidation");
    }

    appReload(): D2ApiResponse<void> {
        return this.d2Api.post<void>("/maintenance/appReload");
    }
}
