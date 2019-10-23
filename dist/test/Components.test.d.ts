import { Address } from './testHarness';
export interface BowlerProps {
    fullName: string;
}
export interface ScoreCardProps {
    fullName: string;
    street: string;
    city: string;
    state: string;
    scores: number[];
    calcAverage: () => number;
    addresses?: Array<Address>;
}
