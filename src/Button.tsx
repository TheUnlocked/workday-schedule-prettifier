import { PropsWithChildren } from 'react';
import styled, { AnyStyledComponent } from 'styled-components'

export const ButtonWrapper = styled.div`
    display: inline-block;
    overflow: hidden;
    user-select: none;
`;

export const FilledButtonShell = styled.div`
    display: inline-block;
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border-radius: 4px;
    padding: 4px 8px;

    ${ButtonWrapper}:hover & {
        background-color: var(--primary-hover);
    }
`;

export const UnfilledButtonShell = styled.div`
    display: inline-block;
    border: var(--primary-color) 1px solid;
    border-radius: 4px;
    padding: 3px 7px;

    ${ButtonWrapper}:hover & {
        border-color: var(--primary-hover);
    }
`;

export function Buttonify<C extends AnyStyledComponent>(Component: C) {
    return function (props: any) {
        return <Component as="button" {...props} className={props.className + " reset--button"} />;
    } as C;
}

export default function Button(props: PropsWithChildren<{
    onClick?: () => void,
    variant?: 'filled' | 'unfilled'
}>) {
    const StyledButton = Buttonify(props.variant === 'unfilled' ? UnfilledButtonShell : FilledButtonShell);
    return (
        <ButtonWrapper>
            <StyledButton as="button" onClick={props.onClick}>
                {props.children}
            </StyledButton>
        </ButtonWrapper>
    );
}