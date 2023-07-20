import axios from "axios";
import fs from "fs";
import _ from "lodash";
import path from "path";
import prettier from "prettier";
import { D2SchemaFieldProperties, D2SchemaProperties, SchemaProperty } from "../schemas";
import { joinPath } from "../utils/connection";
import { ArgumentParser } from "argparse";

interface Schema extends D2SchemaProperties {
    name: string;
    href: string;
    properties: SchemaFieldProperties[];
}

export interface SchemaFieldProperties extends SchemaProperty {
    attribute: boolean;
    simple: boolean;
    readable: boolean;
    identifiableObject: boolean;
    embeddedObject: boolean;
    collection: boolean;
    collectionWrapping?: true;
    cascade?: string;
}

interface Schemas {
    [className: string]: Schema;
}

const schemaProperties: Array<keyof D2SchemaProperties> = [
    "klass",
    "shareable",
    "metadata",
    "relativeApiEndpoint",
    "plural",
    "displayName",
    "collectionName",
    "nameableObject",
    "translatable",
    "identifiableObject",
    "dataShareable",
    "name",
    "persisted",
    "embeddedObject",
];

const schemaFieldProperties: Array<keyof D2SchemaFieldProperties> = [
    "name",
    "fieldName",
    "propertyType",
    "itemPropertyType",
    "klass",
    "itemKlass",
];

const interfaceFromClass: _.Dictionary<string | { type: string; schema: string }> = {
    "org.hisp.dhis.security.acl.Access": "D2Access",
    "org.hisp.dhis.translation.ObjectTranslation": "D2Translation",
    "org.hisp.dhis.translation.Translation": "D2Translation",
    "org.hisp.dhis.common.ObjectStyle": "D2Style",
    "org.hisp.dhis.common.DimensionalKeywords": "D2DimensionalKeywords",
    "com.vividsolutions.jts.geom.Geometry": "D2Geometry",
    "org.locationtech.jts.geom.Geometry": "D2Geometry",
    "org.hisp.dhis.expression.Expression": "D2Expression",
    "org.hisp.dhis.period.PeriodType": "string",
    "org.hisp.dhis.chart.Series": "unknown",
    "org.hisp.dhis.attribute.AttributeValue": {
        type: "D2AttributeValueGeneric<D2Attribute>",
        schema: "D2AttributeValueGenericSchema<D2Attribute, D2AttributeSchema>",
    },
    "org.hisp.dhis.eventdatavalue.EventDataValue": "unknown",
    "org.hisp.dhis.common.DataDimensionItem": "unknown",
    "org.hisp.dhis.common.DimensionalObject": "unknown",
    "org.hisp.dhis.interpretation.Mention": "unknown",
    "org.hisp.dhis.message.Message": "unknown",
    "org.hisp.dhis.message.UserMessage": "unknown",
    "org.hisp.dhis.period.Period": "Ref",
    "org.hisp.dhis.period.RelativePeriods": "unknown",
    "org.hisp.dhis.programstagefilter.EventQueryCriteria": "unknown",
    "org.hisp.dhis.relationship.RelationshipConstraint": "D2RelationshipConstraint",
    "org.hisp.dhis.relationship.RelationshipItem": "unknown",
    "org.hisp.dhis.render.DeviceRenderTypeMap": "unknown",
    "org.hisp.dhis.reporttable.ReportParams": "unknown",
    "org.hisp.dhis.sms.command.code.SMSCode": "unknown",
    "org.hisp.dhis.sms.command.SMSSpecialCharacter": "unknown",
    "org.hisp.dhis.trackedentityattributevalue.TrackedEntityAttributeValue": "unknown",
    "org.hisp.dhis.trackedentitycomment.TrackedEntityComment": "unknown",
    "org.hisp.dhis.trackedentityfilter.EventFilter": "unknown",
    "org.hisp.dhis.trackedentityfilter.FilterPeriod": "unknown",
    "org.hisp.dhis.trackedentity.TrackedEntityAttributeDimension": "unknown",
    "org.hisp.dhis.trackedentity.TrackedEntityProgramOwner": {
        type: "D2ProgramOwner",
        schema: "D2ProgramOwnerSchema",
    },
    "org.hisp.dhis.user.sharing.Sharing": "Sharing",
    "org.hisp.dhis.common.DimensionalItemObject": "unknown",
    "org.hisp.dhis.visualization.ReportingParams": "D2ReportingParams",
    "org.hisp.dhis.visualization.Axis": "D2Axis",
    "java.lang.Object": "object",
    "java.util.Map": "object",
    "java.util.List": "object",
    "org.hisp.dhis.common.DimensionItemKeywords": "unknown",
    "org.hisp.dhis.common.ValueTypeOptions": "unknown",
    "org.hisp.dhis.dashboard.design.ItemConfig": "unknown",
    "org.hisp.dhis.dashboard.design.Layout": "unknown",
    "org.hisp.dhis.program.UserInfoSnapshot": "unknown",
    "org.hisp.dhis.scheduling.JobParameters": "unknown",
    "org.hisp.dhis.security.apikey.ApiTokenAttribute": "unknown",
    "org.hisp.dhis.visualization.AxisV2": "unknown",
    "org.hisp.dhis.visualization.LegendDefinitions": "unknown",
    "org.hisp.dhis.visualization.OutlierAnalysis": "unknown",
    "org.hisp.dhis.visualization.Series": "unknown",
    "org.hisp.dhis.visualization.SeriesKey": "unknown",
    "org.hisp.dhis.visualization.VisualizationFontStyle": "unknown",
};

function getModelName(klass: string, suffix?: string): string {
    const className = _.last(klass.split("."));
    if (!className) {
        throw "No class name";
    } else {
        return `D2${className}${suffix || ""}`;
    }
}

const getType = (
    schema: Schema,
    schemas: Schemas,
    property: SchemaProperty,
    suffix?: string
): string => {
    const { propertyType, constants, itemPropertyType, itemKlass } = property;

    switch (propertyType) {
        case "REFERENCE":
            return getInterface(schema, schemas, property, suffix);
        case "COLLECTION": {
            if (!itemPropertyType || !itemKlass) throw new Error("Missing item info");

            const innerType = getType(
                schema,
                schemas,
                {
                    ...property,
                    propertyType: itemPropertyType,
                    klass: itemKlass,
                },
                suffix
            );
            return `${innerType}[]`;
        }
        case "TEXT":
        case "URL":
        case "PHONENUMBER":
        case "EMAIL":
        case "COLOR":
        case "PASSWORD":
        case "DATE":
            return "string";
        case "IDENTIFIER":
            return "Id";
        case "INTEGER":
            return "number";
        case "CONSTANT":
            return constants ? joinStr(constants) : "never";
        case "COMPLEX":
            return getInterface(schema, schemas, property, suffix);
        case "BOOLEAN":
            return "boolean";
        case "NUMBER":
            return "number";
        case "GEOLOCATION":
            return "string";
        default:
            throw `Unsupported property type: ${propertyType}`;
    }
};

function getInterface(
    schema: Schema,
    schemas: Schemas,
    property: SchemaProperty,
    suffix?: string
): string {
    const className = _.last(property.klass.split(".")) || "";

    if (schemas[className]) {
        return `D2${className}${suffix || ""}`;
    } else if (interfaceFromClass[property.klass]) {
        const value = interfaceFromClass[property.klass];
        if (typeof value === "string") {
            if (value === "D2Access") {
                return schema.dataShareable ? "D2AccessWithData" : "D2Access";
            } else {
                return value;
            }
        } else {
            return suffix === "Schema" ? value.schema : value.type;
        }
    } else {
        console.log(`Unsupported complex type, default to unknown: ${property.klass}`);
        return "unknown";
    }
}

function getPropertyName(property: SchemaProperty): string {
    const value = property.collectionName || property.name || property.fieldName;
    if (!value) throw new Error(`No name found for property: ${property}`);
    else return value;
}

/* From 2.35, userAccess and userGroupAccess schemas have empty fields (why?) */

const customModelProperties: _.Dictionary<_.Dictionary<string>> = {
    userAccess: {
        access: "string",
        displayName: "string",
        id: "string",
        userUid: "string",
    },
    userGroupAccess: {
        access: "string",
        displayName: "string",
        id: "string",
        userGroupUid: "string",
    },
};

function getModelProperties(schemas: Schemas, schema: Schema, suffix?: string): string {
    const fromSchema = schema.properties.map(property => [
        getPropertyName(property),
        getType(schema, schemas, property, suffix),
    ]);

    const fromCustom = _.toPairs(customModelProperties[schema.name] || {});
    const pairs = _.isEmpty(fromSchema) ? fromCustom : fromSchema;

    return _(pairs)
        .sortBy()
        .map(([key, value]) => `${key}: ${value}`)
        .join(";");
}

function quote(s: string): string {
    return '"' + s + '"';
}

function getProperties(schema: Schema, predicate: (property: SchemaProperty) => boolean): string {
    return (
        schema.properties
            .filter(predicate)
            .map(property => quote(getPropertyName(property)))
            .join(" | ") || "never"
    );
}

function joinStr(xs: string[]): string {
    return xs.map(quote).join(" | ");
}

type Instance = { version: string; url: string; isDeprecated?: boolean };

const instances: Instance[] = [
    { version: "2.30", url: "http://admin:district@localhost:8030", isDeprecated: true },
    { version: "2.31", url: "http://admin:district@localhost:8031", isDeprecated: true },
    { version: "2.32", url: "https://admin:district@play.dhis2.org/2.32", isDeprecated: true },
    { version: "2.33", url: "https://admin:district@play.dhis2.org/2.33", isDeprecated: true },
    { version: "2.34", url: "https://admin:district@play.dhis2.org/2.34", isDeprecated: true },
    { version: "2.35", url: "https://admin:district@play.dhis2.org/2.35", isDeprecated: true },
    { version: "2.36", url: "https://admin:district@play.dhis2.org/2.36" },
    { version: "2.37", url: "https://admin:district@play.dhis2.org/2.37" },
    { version: "2.38", url: "https://admin:district@play.dhis2.org/2.38" },
    { version: "2.39", url: "https://admin:district@play.dhis2.org/2.39" },
];

async function generateSchema(instance: Instance) {
    const { version, url } = instance;
    const schemaUrl = joinPath(url, "/api/schemas.json?fields=:all,metadata");
    console.debug(`GET ${schemaUrl}`);

    const { schemas: allSchemas } = (await axios.get(schemaUrl, {
        validateStatus: (status: number) => status >= 200 && status < 300,
    })).data as { schemas: Schema[] };

    const schemas = _.sortBy(allSchemas, schema => _.last(schema.klass.split(".")));
    const models = schemas.filter(schema => !!schema.href);
    const schemasByClassName = _.keyBy(schemas, schema => _.last(schema.klass.split(".")) || "");

    const modelsDeclaration = `
        /* eslint-disable */

        import {
            Id, Ref, Preset, FieldPresets, D2SchemaProperties,
            D2Access, D2AccessWithData, D2Translation, D2Geometry, D2Style,
            D2DimensionalKeywords, D2Expression,
            D2RelationshipConstraint, D2ReportingParams, D2Axis, Sharing,
            D2ProgramOwner, D2ProgramOwnerSchema,
            D2AttributeValueGeneric, D2AttributeValueGenericSchema
        } from "../schemas/base";

        ${schemas
            .map(
                schema => `
                export type ${getModelName(schema.klass)} = {
                    ${getModelProperties(schemasByClassName, schema)}
                };
            `
            )
            .join("\n\n")}

        ${schemas
            .map(schema => {
                const modelName = getModelName(schema.klass);
                const schemaName = getModelName(schema.klass, "Schema");

                return `
                    export interface ${schemaName} {
                        name: "${modelName}";
                        model: ${modelName};
                        fields: { ${getModelProperties(schemasByClassName, schema, "Schema")} };
                        fieldPresets: {
                            $all:
                                Preset<${modelName}, keyof ${modelName}>
                            $identifiable:
                                Preset<${modelName}, FieldPresets["identifiable"]>
                            $nameable:
                                Preset<${modelName}, FieldPresets["nameable"]>
                            $persisted:
                                Preset<${modelName}, ${getProperties(schema, p => p.persisted)}>
                            $owner:
                                Preset<${modelName}, ${getProperties(schema, p => p.owner)}>
                        };
                    }
                `;
            })
            .join("\n\n")}

        export type D2Model =
            ${models.map(model => getModelName(model.klass)).join(" | ")}

        export const models: Record<keyof D2ModelSchemas, D2SchemaProperties> =
            ${JSON.stringify(
                _.keyBy(
                    models.map(model => {
                        const schema = _.pick(model, schemaProperties);
                        const properties = model.properties.map(props =>
                            _.pick(props, schemaFieldProperties)
                        );

                        return { ...schema, properties };
                    }),
                    "plural"
                )
            )}

        export type D2ModelSchemas = {
            ${models
                .map(model => `${model.plural}: ${getModelName(model.klass)}Schema`)
                .join(",\n")}
        }
    `;

    const parts = [modelsDeclaration];
    const prettierConfigFile = await prettier.resolveConfigFile();
    if (!prettierConfigFile) throw new Error("Cannot find prettier config file");

    const prettierConfig = await prettier.resolveConfig(prettierConfigFile);
    const data = prettier.format(parts.join("\n"), {
        parser: "typescript",
        ...prettierConfig,
    });

    const parentPath = path.join(__dirname, "..", version);
    fs.mkdirSync(parentPath, { recursive: true });
    const schemasPath = path.join(parentPath, "schemas.ts");
    fs.writeFileSync(schemasPath, data);
    console.log(`Written: ${schemasPath}`);
}

async function generateSchemas(options: { includeDeprecated: boolean }) {
    for (const instance of instances) {
        if (!instance.isDeprecated || options.includeDeprecated) {
            console.log(`Get schemas for ${instance.version}`);
            await generateSchema(instance);
        }
    }
}

function logErrorAndExit(err: any) {
    console.error(err); // eslint-disable-line no-console2
    process.exit(1);
}

const parser = new ArgumentParser({
    description: "Generate schemas from running DHIS2 instances",
});

parser.add_argument("--deprecated", {
    help: "Generate also deprecated versions",
    action: "store_true",
});

const args = parser.parse_args();
generateSchemas({ includeDeprecated: args.deprecated }).catch(logErrorAndExit);
