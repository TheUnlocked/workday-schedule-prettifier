import styled from "styled-components";

export const Stacked = styled.div<{ $horizontal?: boolean, $gap?: string }>`
    display: flex;
    flex-direction: ${props => props.$horizontal ? 'row' : 'column'};
    ${props => props.$gap ? `gap: ${props.$gap};` : ''}
`;