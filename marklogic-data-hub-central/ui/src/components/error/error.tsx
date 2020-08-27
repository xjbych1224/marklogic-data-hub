import React, { useState } from 'react';
import { RouteComponentProps, withRouter, useLocation } from 'react-router-dom';
import styles from './error.module.scss';
import { MLButton } from '@marklogic/design-system';


interface Props extends RouteComponentProps<any>{
    message?: string;
};

const Error: React.FC<Props> = (props) => {
    const location = useLocation();
    const [message, setMessage] = useState(
        (location.state && location.state!['message']) ? location.state!['message'] : 'no message'
    );
    const copyTextInitial = "Copy";
    const [copyText, setCopyText] = useState(copyTextInitial);

    const copyError = () => {
        console.log('copyError');
    }

    const copyToClipBoard = async copyMe => {
        try {
            let text = (location.state && location.state!['message']) ? location.state!['message'] : 'no message';
            await navigator.clipboard.writeText(text);
            setCopyText('Copied!');
            setTimeout(() => setCopyText(copyTextInitial), 3000);
        } catch (err) {
            setCopyText('Failed to copy!');
        }
    };

    return (
        <>
            <div className={styles.content}>
                <div className={styles.sadFace}></div>
                <div className={styles.errorHead}>
                    <div className={styles.title}>Operation failed.</div>
                    <div className={styles.spacer}></div>
                    The operation failed due to unknown reasons.
                    <div className={styles.spacer}></div>
                    Copy the log below and send it to  <a href="#">MarkLogic Support</a>.
                </div>
                <div className={styles.spacer}></div>
                <MLButton
                        className={styles.rightAlign} size="default"
                        type="primary" onClick={copyToClipBoard}
                        aria-label={'copyError'}
                >{copyText}</MLButton>
                <div className={styles.spacer}></div>
                <div className={styles.errorContainer}>
                    {(location.state && location.state!['message']) ? location.state!['message'] : 'no message'}
                </div>
	        </div>
        </>
    )
}

export default withRouter(Error);
