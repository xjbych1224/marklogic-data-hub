import {
    Modal,
    Tabs,
  } from 'antd';
  import React from 'react';
  import NewLoadDialog from '../load/new-load-dialog/new-load-dialog';
  import AdvancedSettingsDialog from "../advanced-settings/advanced-settings-dialog";
  import BasicSettings from "./basic-settings/basic-settings";
  import styles from './step-settings.module.scss';
  import './step-settings.scss';
  
  const { TabPane } = Tabs;
  
  const StepSettings = (props) => {

    const onCancel = () => {
        // if(checkDeleteOpenEligibility()){
        //   setDeleteDialogVisible(true);
        // } else {
          props.setOpenStepSettings(false)
        // }
      }
    
    const onOk = () => {
        props.setOpenStepSettings(false)
    }

    const activityMap = {
        'ingestion': 'Loading',
        'mapping': 'Mapping',
        'custom': 'Custom',
    }

    const getTitle = () => {
        let activity = props.activityType ? activityMap[props.activityType] : '';
        return activity + ' Step Settings';
    }
  
    const handleTab = (key) => {
      console.log('handleTab', key);
    }
  
    return <Modal
      visible={props.openStepSettings}
      title={null}
      width="700px"
      onCancel={() => onCancel()}
      onOk={() => onOk()}
      okText="Save"
      className={styles.SettingsModal}
      footer={null}
      maskClosable={false}
      destroyOnClose={true}
    >
      <div className={styles.settingsContainer}>
        <header>
            <div className={styles.title}>{getTitle()}</div>
            {/* <div className={styles.stepName}>{props.stepData.name}</div> */}
        </header>
        <div className={styles.tabs}>
          <Tabs defaultActiveKey="1" onChange={handleTab} animated={false} tabBarGutter={10}>
            <TabPane tab="Basic" key="1">

                <NewLoadDialog
                    newLoad={props.newLoad}
                    title={props.title}
                    setNewLoad={props.setNewLoad}
                    openStepSettings={props.openStepSettings}
                    setOpenStepSettings={props.setOpenStepSettings}
                    createLoadArtifact={props.createLoadArtifact}
                    stepData={props.stepData}
                    canReadWrite={props.canReadWrite}
                    canReadOnly={props.canReadOnly}
                />
  
            </TabPane>
            <TabPane tab="Advanced" key="2">

                <AdvancedSettingsDialog
                    tooltipData={props.tooltipData}
                    openStepSettings={props.openStepSettings}
                    setOpenStepSettings={props.setOpenStepSettings}
                    stepData={props.stepData}
                    activityType={props.activityType}
                    canWrite={props.canWrite}
                />
  
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Modal>;
  }
  
  export default StepSettings;
  