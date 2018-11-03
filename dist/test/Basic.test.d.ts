export interface Global {
    document: Document;
    window: Window;
    navigator: {
        userAgent: string;
    };
}
import { Address } from './testHarness';
import { ContainerRenderProps } from '../src/components/RenderPropsComponent';
export interface AddressRenderProps extends Address, ContainerRenderProps<Address> {
}
