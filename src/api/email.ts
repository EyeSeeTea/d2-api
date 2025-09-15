import { D2ApiGeneric } from "./d2Api";
import { D2ApiResponse } from "./common";
import { D2ApiRequest } from "./types";

/* https://docs.dhis2.org/master/en/developer/html/webapi_email.html */

export class Email {
    constructor(public d2Api: D2ApiGeneric) {}

    sendSystemNotification(message: NotificationMessage): D2ApiResponse<void> {
        return this.d2Api.post("/email/notification", {}, message);
    }

    sendMessage(message: OutboundMessage): D2ApiResponse<void> {
        const requestOptions = getSendEmailRequestOptions(message);
        return this.d2Api.post("/email/notification", undefined, undefined, requestOptions);
    }

    sendTestMessage(): D2ApiResponse<void> {
        return this.d2Api.post("/email/test");
    }
}

export type OutboundMessage = {
    recipients: string[];
    subject?: string;
    text: string;
};

export type NotificationMessage = {
    subject: string;
    text: string;
};

/*
Outbound emails

The "Outbound emails" section in the documentation shows sending an email via
query string parameters:

curl "http://localhost/api/33/email/notification?recipients=xyz%40abc.com&message=sample%20email&subject=Test%20Email" \
  -X POST -u admin:district

Problem: using query strings quickly hits 414 "URI Too Long" when the message is
large. This endpoint does not support a JSON body.

Solution: send the message in the POST body as application/x-www-form-urlencoded.
Verified with curl:

curl -u user:pass -X POST http://localhost:8080/api/email/notification \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "recipients=EMAIL1,EMAIL2" \
  --data-urlencode "subject=test" \
  --data-urlencode "message=contents"

Implementation: in JavaScript, replicate the same by building a URL-encoded
string for the request body and setting the appropriate headers. d2Api.post is
generic enough to handle this; provide the encoded body and headers.
*/

function toFormBody(entries: Record<string, string>): string {
    return Object.entries(entries)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

function getSendEmailRequestOptions(
    message: OutboundMessage
): Omit<D2ApiRequest, "method" | "url"> {
    return {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        requestBodyType: "raw",
        data: toFormBody({
            recipients: message.recipients.join(","),
            subject: message.subject || "",
            message: message.text,
        }),
    };
}
