import btoa from "btoa";
import { Auth } from "../../api/types";

export function getAuthHeaders(auth?: Auth): Record<string, string> {
    if (!auth) return {};

    switch (auth.type) {
        case undefined:
        case "basic":
            return { Authorization: "Basic " + btoa(auth.username + ":" + auth.password) };
        case "personalToken":
            return { Authorization: `ApiToken ${auth.token}` };
    }
}
