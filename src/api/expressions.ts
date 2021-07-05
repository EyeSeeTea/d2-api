import { D2ApiResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";

export type ExpressionType =
    | "predictor-formula"
    | "predictor-skip-test"
    | "indicator"
    | "program-indicator-formula"
    | "program-indicator-filter"
    | "validation-rule";

type ValidationResponse = {
    description: string;
    httpStatus: "OK" | "Conflict";
    httpStatusCode: number;
    status: "OK" | "ERROR";
    message: string;
};

export class Expressions {
    constructor(public d2Api: D2ApiGeneric) {}

    validate(type: ExpressionType, expression: string): D2ApiResponse<ValidationResponse> {
        return this.d2Api.request<ValidationResponse>({
            method: "post",
            url: buildUrl(type),
            data: expression,
            bodyType: "raw",
        });
    }
}

function buildUrl(type: ExpressionType): string {
    switch (type) {
        case "indicator":
            return "/indicators/expression/description";
        case "program-indicator-formula":
            return "/programIndicators/expression/description";
        case "program-indicator-filter":
            return "/programIndicators/filter/description";
        case "predictor-formula":
            return "predictors/expression/description";
        case "predictor-skip-test":
            return "predictors/skipTest/description";
        case "validation-rule":
            return "/validationRules/expression/description";
    }
}
