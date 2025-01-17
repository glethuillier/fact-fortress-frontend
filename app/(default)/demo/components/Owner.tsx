"use client";
import { ChangeEvent, useEffect, useState } from 'react';
import Notiflix from 'notiflix';

import type { CheckboxValueType } from 'antd/es/checkbox/Group';

import { Card, Col, Row, Space, Divider, Button, Input, Form, Select, message, QRCode, Upload, Checkbox } from 'antd';
import { UserOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';
import React from 'react';
import SizeContext from 'antd/es/config-provider/SizeContext';
import { stringify } from 'querystring';

const { TextArea } = Input;
const { Search } = Input;

export default function Owner() {
    const [form] = Form.useForm();
    const [mint, setMint] = useState<any[]>([]);
    const [hospitalAccounts, setHospitalAccounts] = useState<any[]>([]);
    const [researcherAccounts, setResearcherAccounts] = useState<any[]>([]);
    const [from, setFrom] = useState<CheckboxValueType[]>([]);
    const [success, setSuccess] = useState(true)
    const [options, setOptions] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const { Option } = Select;

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
    };
    const handleOptionChange = (value: string[]) => {
        let res: any = []
        for (let i = 0; i < value.length; i++) {
            res.push({ value: value[i], label: value[i] })
        }
        setOptions(res)
    };


    const handleMint = async (recipient: any) => {
        // let address = getAddress(recipient);
        const apiCall = () => {
            return axios.get('http://localhost:3000/authorize_provider?address=' + recipient, {
                headers: {
                    'from': 'owner'
                }
            }
            )
        }

        apiCall()
            .then(response => {
                // setMint([...mint, response.data])
                setMint((prev) => [...prev, response.data])
                setSuccess(success && true)
            })
            .catch(error => {
                setSuccess(false)
                console.log(error);
            });
    }
    const handleMintResearcher = async (recipient: string, accessTypes: any) => {
        axios
            .post(
                `http://localhost:3000/authorize_analyzer?address=${recipient}`,
                { access_policies: accessTypes },
                {
                    headers: {
                        "Content-Type": "application/json",
                        from: "owner",
                    },
                }
            )
            .then(async (response) => {
                setMint((prev) => [...prev, response.data])
                setSuccess(success && true)
            })
            .catch((error) => {
                console.error(error);
                setSuccess(false)
            });
    }

    const goToNextPage = () => {
        window.scrollTo({
            top: 1000,
            behavior: "smooth",
        });
    };
    const onChange = (checkedValues: CheckboxValueType[]) => {
        console.log('checked = ', checkedValues);
    };

    const onFinish = async (values: any) => {
        console.log('Finish:', values);

        for (let i = 0; i < hospitalAccounts.length; i++) {
            await handleMint(hospitalAccounts[i]['address'])
        }
        // // let types = values['default-type']
        // // if (values['default-type'] == undefined) {
        // //     types = ['access_type_a']
        // // }
        // // let researchers = [["0xac46159C08f103f7fF87ED138CFf7e389aac0550", types]]
        // // if (values['researchers'] != undefined) {
        // //     for (let i = 0; i < values['researchers'].length; i++) {
        // //         let curr_types = values['researchers'][i]['default-type']
        // //         if (curr_types == undefined) {
        // //             curr_types = ['access_type_a']
        // //         }
        // //         researchers.concat([values['researchers'][i]['last'], curr_types])
        // //     }
        // // }

        for (let i = 0; i < researcherAccounts.length; i++) {
            if (values[researcherAccounts[i]['account_name'] + 'type'] == undefined) {
                await handleMintResearcher(researcherAccounts[i]['address'], researcherAccounts[i]['access_types'])
            } else {
                // console.log(values[researcherAccounts[i]['account_name'] + 'type'])
                await handleMintResearcher(researcherAccounts[i]['address'], values[researcherAccounts[i]['account_name'] + 'type'])
            }
        }
        // console.log(promiseArray)
        // Promise.allSettled(promiseArray).then(tokens => {
        //     console.log(tokens)
        //     setMint(tokens)
        // })

    };

    useEffect(() => {
        // reset
        axios
            .get('http://localhost:3000/reset_accounts', {
                headers: {
                    "Content-Type": "application/json",
                    from: "owner",
                },
            })
            .then((res) => {
                console.log(res.data)
            })
            .catch(function (error) {
                Notiflix.Report.failure('Error', 'The Fact Fortress backend is not up and running. To run it: `pnpm backend` and wait for the message `server started on port 3000`', 'Ok');
            })

        // get all accounts
        axios
            .get('http://localhost:3000/accounts?account_type=data_providers')
            .then((res) => {
                setHospitalAccounts(res.data)
            })
        axios
            .get('http://localhost:3000/accounts?account_type=data_analyzers')
            .then((res) => {
                setResearcherAccounts(res.data)
            })
        axios
            .get('http://localhost:3000/all_access_policies')
            .then((res) => {
                console.log(res.data)
                let temp: any = []
                for (let i = 0; i < res.data['access_policies'].length; i++) {
                    temp.push({
                        value: res.data['access_policies'][i],
                        label: res.data['access_policies'][i]
                    })
                }
                setOptions(temp)
            })
    }, [])
    console.log(mint)

    return (
        <div
            // class="h-14 bg-gradient-to-r from-emerald-500 to-green-900"
            style={{ margin: 0, height: '100%' }}
        >
            {hospitalAccounts.length > 0 && researcherAccounts.length > 0 && options.length > 0 &&
                <Card
                    style={{ margin: 40, height: '90%' }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <b>Authorize data providers to upload their public keys on-chain</b>
                    </div>
                    <Form form={form} name="horizontal_login" layout="vertical" onFinish={onFinish} >
                        <Form.Item
                            label='Data Providers'
                            name="recipient1"
                        >
                            {hospitalAccounts.map((val) =>
                                <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                                    <Form.Item
                                        label='Name'
                                        style={{ flex: 1 }}
                                        name={['default', 'first']}
                                    >
                                        <Input defaultValue={val['account_name']} disabled={true} />
                                    </Form.Item>
                                    <Form.Item
                                        label='Address'
                                        name={['default', 'address']}
                                        style={{ flex: 1 }}
                                    >
                                        <Input style={{ width: '100%' }} defaultValue={val.address} disabled={true} />
                                    </Form.Item>
                                </div>

                            )}
                            {/* <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                            <Form.Item
                                label='Name'
                                style={{flex: 1}}
                                name={['default', 'first']}
                            >
                                <Input defaultValue="Provider A Wallet" disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                label='Address'
                                name={['default', 'address']}
                                style={{flex: 1}}
                            >
                                <Input style={{width: '100%'}} defaultValue="0x98526c571e324028250B0f5f247Ca4F1b575fadB" disabled={true} />
                            </Form.Item>
                    </div>
                    <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                            <Form.Item
                            label='Name'
                            name={['default', 'first']}
                            style={{flex: 1}}
                            >
                                <Input defaultValue="Provider B Wallet" disabled={true}/>
                            </Form.Item>
                            <Form.Item
                            label='Address'
                            style={{flex: 1}}
                                name={['default', 'address']}
                            >
                                <Input defaultValue="0x99eBB39932f6F697194EA70115762d4c06D1A9c9" disabled={true} />
                            </Form.Item>
                    </div> */}

                            <Form.List name="hospitals">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                                                <Form.Item
                                                    {...restField}
                                                    label='Name'
                                                    style={{ flex: 1 }}
                                                    name={[name, 'first']}
                                                >
                                                    <Input placeholder="Hospital Name" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    label='Address'
                                                    style={{ flex: 1 }}
                                                    name={[name, 'last']}
                                                >
                                                    <Input placeholder="Address" />
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add field
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <b>Define how data analyzers should access the data</b>
                        </div>
                        <Form.Item
                            label='Available Access Policies'
                            name="access_types"
                            style={{ flex: 1 }}
                        >
                            <Select
                                mode="tags"
                                placeholder="select access policy"
                                defaultValue={Array.from(new Set(options.map((val: any) => val['label'])))}
                                onChange={handleOptionChange}
                                optionLabelProp="label"
                                options={options}
                            />
                        </Form.Item>
                        <Form.Item
                            label='Data Analyzers'
                            name="recipient4"
                        >
                            {researcherAccounts.map((val) =>
                                <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                                    <Form.Item
                                        label='Name'
                                        style={{ flex: 1 }}
                                        name={[val['account_name'] + stringify(val['account_id']), 'first']}
                                    >
                                        <Input defaultValue={val['account_name']} disabled={true} />
                                    </Form.Item>
                                    <Form.Item
                                        label='Address'
                                        name={[val['account_name'] + stringify(val['account_id']), 'address']}
                                        style={{ flex: 1 }}
                                    >
                                        <Input style={{ width: '100%' }} defaultValue={val.address} disabled={true} />
                                    </Form.Item>
                                    <Form.Item
                                        name={val['account_name'] + 'type'}
                                        label='Access Policies'
                                        style={{ flex: 1 }}
                                    >
                                        <Select
                                            mode="multiple"
                                            placeholder="select policy"
                                            defaultValue={val['access_types']}
                                            onChange={handleChange}
                                            optionLabelProp="label"
                                            options={options}
                                        />
                                    </Form.Item>
                                </div>

                            )}
                            {/* <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                            <Form.Item
                                name={'default-name'}
                                label='Name'
                                style={{flex: 1}}
                            >
                                <Input defaultValue="Wallet_Name_Researcher_1" disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                name={'default-address'}
                                label='Address'
                                style={{flex: 1}}
                            >
                                <Input defaultValue="0xac46159C08f103f7fF87ED138CFf7e389aac0550" disabled={true} />
                            </Form.Item>
                            <Form.Item
                                name={'default-type'}
                                label='Access Types'
                                style={{flex: 1}}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="select type"
                                    defaultValue={['access_type_a']}
                                    onChange={handleChange}
                                    optionLabelProp="label"
                                    options={options}
                                />
                            </Form.Item>
                        </div> */}
                            <Form.List name="researchers">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div style={{ display: "inline-flex", gap: "8px", width: '100%' }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'first']}
                                                    label='Name'
                                                    style={{ flex: 1 }}
                                                >
                                                    <Input placeholder="Researcher Name" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'last']}
                                                    label='Address'
                                                    style={{ flex: 1 }}
                                                >
                                                    <Input placeholder="Address" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'type']}
                                                    label='Acess Types'
                                                    style={{ flex: 1 }}
                                                >

                                                    <Select
                                                        mode="multiple"
                                                        placeholder="select access policy"
                                                        defaultValue={['access_type_a']}
                                                        onChange={handleChange}
                                                        optionLabelProp="label"
                                                        options={options}
                                                    />
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add field
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                Authorize
                            </Button>
                        </Form.Item>
                    </Form>
                    {mint.length > 4 &&
                        <div style={{ width: '100%', fontWeight: 'bold' }}>
                            {<TextArea rows={5} style={{ color: 'black' }} defaultValue={mint.map((token) => (JSON.stringify(token)))} />}
                            {/* <Card bodyStyle={{overflowWrap: 'break-word'}}>{JSON.stringify(key_a)}</Card> */}
                            {/* <textarea readOnly={true} defaultValue={JSON.stringify(key_a)} style={{width: '100%', maxWidth: '100%', fontWeight: 'bold'}} /> */}
                        </div>
                    }
                </Card>
            }
        </div>
    )
}
