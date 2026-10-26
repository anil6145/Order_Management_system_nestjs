import { ValueTransformer } from "typeorm";

export const priceTransformer : ValueTransformer = {
    to : (value : number | string) => value,
    from : (value : string) => Number(value)
}