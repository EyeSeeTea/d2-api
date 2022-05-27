import { D2ApiGeneric } from "./d2Api";
import { cache } from "../utils/cache";
import { TrackerEnrollments } from "./TrackerEnrollments";

export class Tracker {
    constructor(public api: D2ApiGeneric) {}

    @cache()
    get enrollments() {
        return new TrackerEnrollments(this.api);
    }
}
