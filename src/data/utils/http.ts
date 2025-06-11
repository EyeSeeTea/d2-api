import btoa from "btoa";
import { Auth } from "../../api/types";

export function getAuthHeaders(auth?: Auth): Record<string, string> {
    if (!auth) return {};

    if (!auth.type || auth.type === "basicAuth") {
        return { Authorization: "Basic " + btoa(auth.username + ":" + auth.password) };
    } else if (auth.type === "personalToken") {
        return { Authorization: `ApiToken ${auth.token}` };
    } else {
        return {};
    }
}
