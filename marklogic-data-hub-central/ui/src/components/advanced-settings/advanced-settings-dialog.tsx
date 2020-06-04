import {
  Modal,
  Form,
  Input,
  Button,
  Tooltip,
  Icon,
  Select,
  Switch
} from "antd";
import React, { useState, useEffect, useContext } from "react";
import styles from './advanced-settings-dialog.module.scss';
import { AdvancedSettings } from '../../config/tooltips.config';
import { UserContext } from '../../util/user-context';
import Axios from "axios";

const {Option} = Select;

const AdvancedSettingsDialog = (props) => {
  const { resetSessionTime } = useContext(UserContext);
  const settingsTooltips = Object.assign({}, AdvancedSettings, props.tooltipsData);
  const activityType = props.activityType;
  const [defaultCollections, setDefaultCollections] = useState<any[]>([]);
  const usesTargetFormat = activityType === 'mapping';
  const [isTargetFormatTouched, setTargetFormatTouched] = useState(false);
  const [targetFormat, setTargetFormat] = useState('JSON');
  const targetFormatOptions = ['JSON', 'XML'].map(d => <Option data-testid='targetFormatOptions' key={d}>{d}</Option>);
  const usesSourceDatabase = activityType !== 'ingestion';
  const defaultTargetDatabase = !usesSourceDatabase ? 'data-hub-STAGING' : 'data-hub-FINAL';
  const defaultSourceDatabase = usesSourceDatabase ? 'data-hub-STAGING' : 'data-hub-FINAL';
  const defaultBatchSize = 100;
  const [tgtDatabase, setTgtDatabase] = useState(defaultTargetDatabase);
  const [srcDatabase, setSrcDatabase] = useState(defaultSourceDatabase);
  const[ additionalCollections, setAdditionalCollections ] = useState<any[]>([]);
  const [isAddCollTouched, setAddCollTouched] = useState(false);
  const [isSrcDatabaseTouched, setSrcDatabaseTouched] = useState(false);
  const [isTgtDatabaseTouched, setTgtDatabaseTouched] = useState(false);
  const [targetPermissions, setTargetPermissions] = useState('');
  const [isTgtPermissionsTouched, setIsTgtPermissionsTouched] = useState(false);
  const [provGranularity, setProvGranularity] = useState('coarse');
  const [isProvGranTouched, setIsProvGranTouched] = useState(false);
  const [batchSize, setBatchSize] = useState(defaultBatchSize);
  const [isBatchSizeTouched, setBatchSizeTouched] = useState(false);
  const [module, setModule] = useState('');
  const [isModuleTouched, setIsModuleTouched] = useState(false);
  const [cHparameters, setCHparameters] = useState(JSON.stringify({}, null, 4));
  const [isCHParamTouched, setIsCHParamTouched] = useState(false);
  const [user, setUser] = useState('');
  const [isUserTouched, setIsUserTouched] = useState(false);
  const [runBefore, setRunBefore] = useState(false);
  const [isRunBeforeTouched, setIsRunBeforeTouched] = useState(false);
  //const [mlcpCommand, setMLCPCommand] = useState('');
  const [toExpand, setToExpand] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isLoading,setIsLoading] = useState(false);

  const canReadWrite = props.canWrite;

  const tgtDatabaseOptions = ['data-hub-STAGING','data-hub-FINAL'];

  const provenanceGranularityOptions = {
    'Coarse-grained': 'coarse',
    'Off': 'off'
  };

  useEffect(() => {
    getSettingsArtifact();

    return () => {
      setSrcDatabaseTouched(false);
      setTgtDatabaseTouched(false);
      setAddCollTouched(false);
      setIsTgtPermissionsTouched(false);
      setIsModuleTouched(false);
      setIsCHParamTouched(false);
      setIsProvGranTouched(false);
      setIsUserTouched(false);
      setIsRunBeforeTouched(false);
      setTargetFormatTouched(false);
      setSrcDatabase(defaultSourceDatabase);
      setTgtDatabase(defaultTargetDatabase);
      setAdditionalCollections([]);
      setTargetPermissions('');
      setModule('');
      setCHparameters(JSON.stringify({}, null, 4));
      setProvGranularity('coarse');
      setBatchSizeTouched(false);
      setUser('');
      setRunBefore(false);

    };
  },[props.openAdvancedSettings  ,isLoading])

//CREATE/POST settings Artifact
const createSettingsArtifact = async (settingsObj) => {
  if (props.stepData.name) {
    try {
      setIsLoading(true);
      let response = await Axios.put(`/api/steps/${activityType}/${props.stepData.name}/settings`, settingsObj);
      if (response.status === 200) {
        setIsLoading(false);
      }
    } catch (error) {
      let message = error.response.data.message;
      console.error('Error while creating the activity settings artifact', message)
      setIsLoading(false);
    } finally {
      resetSessionTime();
    }
  }
}

//GET the settings artifact
const getSettingsArtifact = async () => {
  if (props.stepData.name) {
    try {
      let response = await Axios.get(`/api/steps/${activityType}/${props.stepData.name}/settings`);

      if (response.status === 200) {
        if (response.data.sourceDatabase) {
          setSrcDatabase(response.data.sourceDatabase);
        }
        if (response.data.collections) {
          setDefaultCollections(response.data.collections);
        }
        setTgtDatabase(response.data.targetDatabase);
        setAdditionalCollections([...response.data.additionalCollections]);
        setTargetPermissions(response.data.permissions);
        setTargetFormat(response.data.targetFormat);
        if (response.data.customHook) {
          setModule(response.data.customHook.module);
          setCHparameters(response.data.customHook.parameters);
          setUser(response.data.customHook.user);
          setRunBefore(response.data.customHook.runBefore);
        }
        setProvGranularity(response.data.provenanceGranularityLevel);
        setBatchSize(response.data.batchSize);
      }
    } catch (error) {
      let message = error.response;
      console.error('Error while fetching load settings artifacts', message || error);
      setSrcDatabase(defaultSourceDatabase);
      setTgtDatabase(defaultTargetDatabase);
      setAdditionalCollections([]);
      setTargetPermissions('');
      setTargetFormat('JSON');
      setModule('');
      setCHparameters(JSON.stringify({}, null, 4));
      setProvGranularity('coarse');
      setBatchSize(defaultBatchSize);
      setUser('');
      setRunBefore(false);
    } finally {
      resetSessionTime();
    }
  }
}

  const onCancel = () => {
    if(checkDeleteOpenEligibility()){
      setDeleteDialogVisible(true);
    } else {
      props.setOpenAdvancedSettings(false)
    }
  }

  const onOk = () => {
    props.setOpenAdvancedSettings(false)
  }

  //Check if Delete Confirmation dialog should be opened or not.
  const checkDeleteOpenEligibility = () => {

      if(!isSrcDatabaseTouched
      &&!isTgtDatabaseTouched
      && !isAddCollTouched
      && !isTgtPermissionsTouched
      && !isModuleTouched
      && !isCHParamTouched
      && !isTargetFormatTouched
      && !isProvGranTouched
      && !isBatchSizeTouched
      && !isUserTouched
      && !isRunBeforeTouched
      ) {
              return false;
        } else {
          return true;
         }
  }

  const onDelOk = () => {
    props.setOpenAdvancedSettings(false)
    setDeleteDialogVisible(false)
  }

  const onDelCancel = () => {
    setDeleteDialogVisible(false)
  }

  const deleteConfirmation = <Modal
        visible={deleteDialogVisible}
        bodyStyle={{textAlign: 'center'}}
        width={250}
        maskClosable={false}
        closable={false}
        footer={null}
    >
        <span className={styles.ConfirmationMessage}>Discard changes?</span><br/><br/>

        <div >
            <Button onClick={() => onDelCancel()}>No</Button>
            &nbsp;&nbsp;
            <Button type="primary" htmlType="submit" onClick={onDelOk}>Yes</Button>
          </div>
    </Modal>;

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    if (event) event.preventDefault();

    let dataPayload = {
        collections: defaultCollections,
        additionalCollections : additionalCollections,
        sourceDatabase : usesSourceDatabase ? srcDatabase : null,
        targetDatabase : tgtDatabase,
        targetFormat: targetFormat,
        permissions : targetPermissions,
        provenanceGranularityLevel: provGranularity,
        batchSize: batchSize,
        customHook : {
            module : module,
            parameters : cHparameters,
            user : user,
            runBefore : runBefore
        }
      }

    createSettingsArtifact(dataPayload);
    props.setOpenAdvancedSettings(false)
  }

  const handleChange = (event) => {
    if (event.target.id === 'targetPermissions') {
      setTargetPermissions(event.target.value);
      setIsTgtPermissionsTouched(true);
    }

    if (event.target.id === 'module') {
      setModule(event.target.value);
      setIsModuleTouched(true);
    }

    if (event.target.id === 'cHparameters') {
      setCHparameters(event.target.value);
      setIsCHParamTouched(true);
    }

    if (event.target.id === 'user') {
      setUser(event.target.value);
      setIsUserTouched(true);
    }

    if (event.target.id === 'batchSize'){
      setBatchSize(event.target.value);
      setBatchSizeTouched(true);
    }
  }

  const handleTargetFormat = (value) => {
    if (value === ' ' || value === targetFormat) {
      setTargetFormatTouched(false);
    }
    else {
      setTargetFormat(value);
      setTargetFormatTouched(true);
    }
  }

  const handleTgtDatabase = (value) => {

    if (value === ' ') {
      setTgtDatabaseTouched(false);
    }
    else {
      setTgtDatabaseTouched(true);
      setTgtDatabase(value);
    }
  }


    const handleSrcDatabase = (value) => {

        if (value === ' ') {
            setSrcDatabaseTouched(false);
        }
        else {
            setSrcDatabaseTouched(true);
            setSrcDatabase(value);
        }
    }

  const handleAddColl = (value) => {

    if (value === ' ') {
      setAddCollTouched(false);
    }
    else {
      setAddCollTouched(true);
      // default collections will come from default settings retrieved. Don't want them to be added to additionalCollections property
      setAdditionalCollections(value.filter((col) => !defaultCollections.includes(col)));
    }
  }

  const handleProvGranularity = (value) => {

    if (value === ' ') {
      setIsProvGranTouched(false);
    }
    else {
      setIsProvGranTouched(true);
      setProvGranularity(value);
    }
  }

  const handleRunBefore = (checked, event) => {
    if (checked) {
      setRunBefore(true);
      setIsRunBeforeTouched(true);
    } else {
      setRunBefore(false);
      setIsRunBeforeTouched(true);
    }
  }

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 15 },
    },
  };

  const toggleCustomHook = () => {
    if (!toExpand) {
      setToExpand(true);
    } else {
      setToExpand(false);
    }
  }

  const customHookProperties = <div><Form.Item label={<span className={styles.cHItemLabel}>
    Module:&nbsp;
    &nbsp;
</span>} labelAlign="left"
    className={styles.formItem}>
    <Input
      id="module"
      placeholder="Please enter module"
      value={module}
      onChange={handleChange}
      disabled={!canReadWrite}
      className={styles.inputWithTooltip}
    />&nbsp;&nbsp;
    <Tooltip title={settingsTooltips.module}>
      <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
    </Tooltip>
  </Form.Item>
    <Form.Item label={<span className={styles.cHItemLabel}>
      Parameters:&nbsp;
      &nbsp;
</span>} labelAlign="left"
      className={styles.formItem}>
      <Input
        id="cHparameters"
        placeholder="Please enter parameters"
        value={cHparameters}
        onChange={handleChange}
        disabled={!canReadWrite}
        className={styles.inputWithTooltip}
      />&nbsp;&nbsp;
      <Tooltip title={settingsTooltips.cHParameters}>
        <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
      </Tooltip>
    </Form.Item>
    <Form.Item label={<span className={styles.cHItemLabel}>
      User:&nbsp;
      &nbsp;
</span>} labelAlign="left"
      className={styles.formItem}>
      <Input
        id="user"
        placeholder="Please enter user information"
        value={user}
        onChange={handleChange}
        disabled={!canReadWrite}
        className={styles.inputWithTooltip}
      />&nbsp;&nbsp;
      <Tooltip title={settingsTooltips.user}>
        <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
      </Tooltip>
    </Form.Item>
    <Form.Item label={<span className={styles.cHItemLabel}>
      RunBefore:
      &nbsp;
</span>} labelAlign="left"
      className={styles.formItem}>
      <Switch checked={runBefore} checkedChildren="ON" unCheckedChildren="OFF" onChange={handleRunBefore} disabled={!canReadWrite} />&nbsp;&nbsp;
      <Tooltip title={settingsTooltips.runBefore} placement={'right'}>
        <Icon type="question-circle" className={styles.questionCircle} theme="filled" />
      </Tooltip>
    </Form.Item></div>

  const tgtDbOptions = tgtDatabaseOptions.map(d => <Option data-testid='dbOptions' key={d}>{d}</Option>);
  const srcDbOptions = tgtDatabaseOptions.map(d => <Option data-testid='srcDbOptions' key={d}>{d}</Option>);

  const provGranOpt = Object.keys(provenanceGranularityOptions).map(d => <Option data-testid='provOptions' key={provenanceGranularityOptions[d]}>{d}</Option>);

  return <Modal
    visible={props.openAdvancedSettings}
    title={null}
    width="700px"
    onCancel={() => onCancel()}
    onOk={() => onOk()}
    okText="Save"
    className={styles.SettingsModal}
    footer={null}
    maskClosable={false}>
    <p className={styles.title}>Advanced Settings</p>
    <p className={styles.stepName}>{props.stepData.name}</p>
    <br/>
    <div className={styles.newDataForm}>
      <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
        {usesSourceDatabase ? <Form.Item label={<span>
            Source Database:&nbsp;
            </span>} labelAlign="left"
                                         className={styles.formItem}>
          <Select
            id="sourceDatabase"
            placeholder="Please select source database"
            value={srcDatabase}
            onChange={handleSrcDatabase}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
          >
            {srcDbOptions}
          </Select>&nbsp;&nbsp;
          <Tooltip title={settingsTooltips.sourceDatabase}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </Form.Item> : null
        }<Form.Item label={<span>
            Target Database:
        &nbsp;
            </span>} labelAlign="left"
                    className={styles.formItem}>
        <Select
          id="targetDatabase"
          placeholder="Please select target database"
          value={tgtDatabase}
          onChange={handleTgtDatabase}
          disabled={!canReadWrite}
          className={styles.inputWithTooltip}
        >
          {tgtDbOptions}
        </Select>&nbsp;&nbsp;
        <Tooltip title={settingsTooltips.targetDatabase}>
          <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
        </Tooltip>
      </Form.Item>
        <Form.Item label={<span>
            Target Collections:
          &nbsp;
            </span>} labelAlign="left" className={styles.formItemTargetCollections}>
          <Select
            id="additionalColl"
            mode="tags"
            style={{width: '100%'}}
            placeholder="Please add target collections"
            value={additionalCollections}
            disabled={!canReadWrite}
            onChange={handleAddColl}
            className={styles.inputWithTooltip}
          >
            {additionalCollections.map((col) => {
              return <Option value={col} key={col} label={col}>{col}</Option>;
            })}
          </Select>&nbsp;&nbsp;
          <Tooltip title={settingsTooltips.additionalCollections}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </Form.Item>
        <Form.Item label={<span className={styles.cHItemLabel}>
            Default Collections:&nbsp;
       &nbsp;
        </span>} labelAlign="left" className={styles.formItem}>
        <div className={styles.defaultCollections}>{defaultCollections.map((collection, i) => {return <div data-testid={`defaultCollections-${collection}`} key={i}>{collection}</div>})}</div>
        </Form.Item>
        <Form.Item label={<span>
            Target Permissions:&nbsp;
          &nbsp;
            </span>} labelAlign="left"
                   className={styles.formItem}>
          <Input
            id="targetPermissions"
            placeholder="Please enter target permissions"
            value={targetPermissions}
            onChange={handleChange}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
          />&nbsp;&nbsp;
          <Tooltip title={settingsTooltips.targetPermissions}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </Form.Item>
        {usesTargetFormat ? <Form.Item label={<span>
            Target Format: &nbsp;
            </span>} labelAlign="left"
                                       className={styles.formItem}>
          <Select
            id="targetFormat"
            placeholder="Please select target format"
            value={targetFormat}
            onChange={handleTargetFormat}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
          >
            {targetFormatOptions}
          </Select>&nbsp;&nbsp;
          <Tooltip title={settingsTooltips.targetFormat} placement={'right'}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </Form.Item> : null
        }
        <Form.Item label={<span>
            Provenance Granularity: &nbsp;
            </span>} labelAlign="left"
                   className={styles.formItem}>
          <Select
            id="provGranularity"
            placeholder="Please select provenance granularity"
            value={provGranularity}
            onChange={handleProvGranularity}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
          >
            {provGranOpt}
          </Select>&nbsp;&nbsp;
          <Tooltip title={settingsTooltips.provGranularity} placement={'right'}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </Form.Item>

          <Form.Item label={<span>
            Batch Size: &nbsp;
            </span>} labelAlign="left"
                     className={styles.formItem}>
              <Input
                  id="batchSize"
                  placeholder="Please enter batch size"
                  value={batchSize}
                  onChange={handleChange}
                  disabled={!canReadWrite}
                  className={styles.inputWithTooltip}
              >
              </Input>&nbsp;&nbsp;
              <Tooltip title={settingsTooltips.batchSize} placement={'right'}>
                  <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
              </Tooltip>
          </Form.Item>
        <Form.Item label={<span>
            <span className={styles.cHookLabel} onClick={toggleCustomHook}>Custom Hook</span>&nbsp;&nbsp;
          <Icon type="right" className={styles.rightArrow} onClick={toggleCustomHook} rotate={toExpand ? 90 : 0}/>
          </span>} labelAlign="left"
                   className={styles.formItem}/>
        {toExpand ? customHookProperties : ''}

        <Form.Item className={styles.submitButtonsForm}>
          <div className={styles.submitButtons}>
            <Button data-testid={`${props.stepData.name}-cancel-settings`} onClick={() => onCancel()}>Cancel</Button>
            &nbsp;&nbsp;
            <Button id={'saveButton'} data-testid={`${props.stepData.name}-save-settings`} type="primary" htmlType="submit" onClick={handleSubmit}
                    disabled={!canReadWrite}>Save</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
    {deleteConfirmation}
  </Modal>;
}

export default AdvancedSettingsDialog;
