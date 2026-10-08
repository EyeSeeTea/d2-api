import _ from "lodash";

import { D2ApiGeneric } from "./d2Api";
import { Id, Pager } from "./base";
import { CancelableResponse } from "../repositories/CancelableResponse";

export class SqlViews {
    constructor(public api: D2ApiGeneric) {}

    query<Variables extends object, Field extends string>(
        id: Id,
        variables: Variables,
        paging?: SqlViewPaging
    ): CancelableResponse<SqlViewGetData<Field>> {
        /*
        Example:

            GET /api/sqlViews/ID/data
                    ?var=orgUnitId:H8RixfF8ugH
                    ?var=period:2018
                    &pageSize=10
                    &page=2
                    &fields=id,name
                    &filter=name:like:abc
        */
        const variableParams = _(variables)
            .toPairs()
            .map(([key, value]) => `${key}:${value}`)
            .value();
        const params = { var: variableParams, ...paging };

        return this.api
            .get<SqlViewDataResponse<Field>>(`/sqlViews/${id}/data`, params)
            .map(({ data }) => {
                const columns = data.listGrid.headers.map(header => header.column);
                const rows = data.listGrid.rows.map(
                    row => _.zipObject(columns, row) as Record<Field, string>
                );
                return { pager: data.pager, rows };
            });
    }
}

export interface SqlViewPaging {
    page?: number;
    pageSize?: number;
}

export interface SqlViewGetData<Field extends string> {
    pager: Pager;
    rows: Array<Record<Field, string>>;
}

export interface SqlViewDataResponse<Field extends string> {
    pager: Pager;
    listGrid: {
        metaData: object;
        headerWidth: number;
        width: number;
        title: string;
        height: number;
        headers: SqlViewDataHeader<Field>[];
        rows: Row[];
    };
}

export type Row = string[];

export interface SqlViewDataHeader<Field extends string> {
    hidden: boolean;
    meta: boolean;
    name: string;
    column: Field;
    type: string;
}
