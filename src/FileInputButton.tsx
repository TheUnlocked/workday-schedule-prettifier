import { ChangeEvent, useState } from 'react';
import styled from 'styled-components'
import { ButtonWrapper, FilledButtonShell, UnfilledButtonShell } from './Button';

const Input = styled.input`
    position: absolute;
    left: -999999rem;
`;

const Label = styled.label`
    display: inline-block;
`;

const Wrapper = styled(ButtonWrapper)`
    border-radius: 4px;
`;

const Filled = styled(FilledButtonShell)`
    border-radius: 4px 0 0 4px;
`;

const Unfilled = styled(UnfilledButtonShell)`
    border-radius: 0 4px 4px 0;
    border-left: 0;
`;

export default function FileInputButton(props: {
    onSelected?: (file: FileList) => void;
}) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    function onChangeHandler(e: ChangeEvent<HTMLInputElement>) {
        setSelectedFiles([...e.target.files!]);
        props.onSelected?.(e.target.files!);
    }

    const selectedFilesDisplay = selectedFiles.length > 0
        ? selectedFiles.length === 1
            ? selectedFiles[0].name
            : `${selectedFiles[0].name} and ${selectedFiles.length - 1} more`
        : '';

    return (
        <Label>
            <Input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={onChangeHandler}></Input>
            <Wrapper>
                <Filled>Choose File</Filled>
                {selectedFilesDisplay ? <Unfilled>{selectedFilesDisplay}</Unfilled> : ''}
            </Wrapper>
        </Label>
    );
}