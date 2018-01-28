import { StateObject } from '../src/types/State';
export interface Name {
    prefix?: string;
    suffix?: string;
    first: string;
    middle: string;
    last: string;
    address?: Address;
    bowlingScores?: Array<number>;
}
export declare type NameContainer = Name & StateObject;
export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
}
