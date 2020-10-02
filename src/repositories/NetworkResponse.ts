import { Canceler } from "axios";
import { NetworkResponse } from "./NetworkRepository";

export class CancelableResponse<Data> {
    constructor(public cancel: Canceler, public response: Promise<NetworkResponse<Data>>) {}

    static build<BuildData>(options: {
        cancel?: Canceler;
        response: Promise<NetworkResponse<BuildData>>;
    }): CancelableResponse<BuildData> {
        const { cancel, response } = options;
        return new CancelableResponse(cancel || noop, response);
    }

    getData() {
        return this.response.then(({ data }) => data);
    }

    map<MappedData>(
        mapper: (response: NetworkResponse<Data>) => MappedData
    ): CancelableResponse<MappedData> {
        const { cancel, response } = this;
        const mappedResponse = response.then(
            (response_: NetworkResponse<Data>): NetworkResponse<MappedData> => ({
                ...response_,
                data: mapper(response_),
            })
        );

        return new CancelableResponse<MappedData>(cancel, mappedResponse);
    }

    flatMap<MappedData>(
        mapper: (response: NetworkResponse<Data>) => CancelableResponse<MappedData>
    ): CancelableResponse<MappedData> {
        const { cancel, response } = this;
        let cancel2: Canceler | undefined;

        const mappedResponse = response.then(response_ => {
            const res2 = mapper(response_);
            cancel2 = res2.cancel;
            return res2.response;
        });

        function cancelAll() {
            cancel();
            if (cancel2) cancel2();
        }

        return new CancelableResponse<MappedData>(cancelAll, mappedResponse);
    }
}

const noop = () => {
    return;
};
