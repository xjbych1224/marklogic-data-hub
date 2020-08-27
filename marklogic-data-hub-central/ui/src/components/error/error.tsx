import React, { useState } from 'react';
import { RouteComponentProps, withRouter, useLocation, useHistory } from 'react-router-dom';
import styles from './error.module.scss';
import { MLButton } from '@marklogic/design-system';
import { ArrowLeft } from '@marklogic/design-system/es/MLIcon';

interface Props extends RouteComponentProps<any>{
    message?: string;
};

const Error: React.FC<Props> = (props) => {
    const location = useLocation();
    const history = useHistory();
    const copyTextInitial = "Copy";
    const [copyText, setCopyText] = useState(copyTextInitial);

    const getError = (key) => {
        return (location.state && location.state![key]) ? location.state![key] : '';
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
            <div className={styles.backLink} onClick={() => history.goBack()} style={{cursor: 'pointer'}}>
                <ArrowLeft style={{marginRight: '8px', color: '#5e6aaa'}}/> Back
            </div>
            <div className={styles.content}>
                <div className={styles.sadFace}></div>
                <div className={styles.errorHead}>
                    <div className={styles.title}>Operation failed.</div>
                    <div className={styles.spacer}></div>
                    { getError('title') || getError('message') ? <span>Copy the log below and send it to <a href="#">MarkLogic Support</a>.</span> :
                     <span>Contact <a href="#">MarkLogic Support</a>.</span> }
                </div>
                <div className={styles.spacer}></div>
                { getError('title') || getError('message') ? <div><MLButton
                        className={styles.rightAlign} size="default"
                        type="primary" onClick={copyToClipBoard}
                        aria-label={'copyError'}
                    >{copyText}</MLButton>
                    <div className={styles.spacer}></div>
                    <div className={styles.errorContainer}>
                        {getError('title') + '\n' + getError('message')}
                    </div>
                </div> : null }
	        </div>
        </>
    )
}

export default withRouter(Error);
