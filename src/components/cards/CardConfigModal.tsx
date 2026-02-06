import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, ColorPicker, Slider, Tabs, Select, Switch, DatePicker, Segmented, Typography } from 'antd';
import { DesktopCard, useCardStore } from '../../stores/cardStore';
import { CARD_TYPES } from './types';
import { CARD_COMPONENTS, PlaceholderCard } from './registry';
import baseStyles from './BaseCard.module.scss';
import dayjs from 'dayjs';

interface CardConfigModalProps {
    visible: boolean;
    card: DesktopCard | null;
    onClose: () => void;
}

const PreviewCard: React.FC<{ card: DesktopCard }> = ({ card }) => {
    const Component = CARD_COMPONENTS[card.type] || PlaceholderCard;
    const config = card.parsedConfig || {};
    const background = config.background || config.bgColor || '#ffffff';
    const textColor = config.textColor || '#000000';
    const opacity = typeof config.transparent === 'number' ? (100 - config.transparent) / 100 : 1;

    let size: 'small' | 'medium' | 'large' = 'medium';
    if (card.width <= 240) size = 'small';
    else if (card.width >= 361) size = 'large';

    return (
        <div 
            className={baseStyles.cardWrapper}
            style={{ 
                width: card.width, 
                height: card.height,
                // Scale down if too large for preview area
                maxWidth: '100%',
                maxHeight: '100%',
                // transform: 'scale(0.8)', // Optional: if we want to scale it
            }}
        >
             <div 
                className={baseStyles.cardContent}
                style={{
                    color: textColor,
                    fontSize: config.fontSize,
                    fontFamily: config.fontFamily,
                    '--card-text-color': textColor,
                    '--card-bg-color': background,
                    '--card-font-size': `${config.fontSize}px`,
                    '--card-font-family': config.fontFamily,
                } as React.CSSProperties}
            >
                <div 
                    className={baseStyles.cardBackground}
                    style={{
                        background: background,
                        opacity: opacity,
                    }}
                />
                <div className={baseStyles.innerContent}>
                    <Component card={card} size={size} />
                </div>
            </div>
        </div>
    );
};

export const CardConfigModal: React.FC<CardConfigModalProps> = ({ visible, card, onClose }) => {
    const [form] = Form.useForm();
    const { updateCard, updateCardPosition } = useCardStore();
    const [bgType, setBgType] = React.useState<'color' | 'gradient' | 'image'>('color');
    const [sizePreset, setSizePreset] = React.useState('medium');
    const [previewCard, setPreviewCard] = React.useState<DesktopCard | null>(null);

    const presetColors = [
        '#F5222D', '#FA541C', '#FA8C16', '#FAAD14', '#FADB14', '#A0D911', '#52C41A', '#13C2C2', 
        '#1890FF', '#2F54EB', '#722ED1', '#EB2F96', '#000000', '#ffffff'
    ];

    const fontFamilies = [
        { label: '系统默认', value: 'var(--font-family)' },
        { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
        { label: '宋体', value: 'SimSun, serif' },
        { label: '黑体', value: 'SimHei, sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Times New Roman', value: '"Times New Roman", serif' },
    ];

    const handleSizeChange = (value: string) => {
        setSizePreset(value);
        let w = 300, h = 200;
        if (value === 'small') { w = 200; h = 150; }
        if (value === 'medium') { w = 300; h = 200; }
        if (value === 'large') { w = 400; h = 300; }
        if (value !== 'custom') {
            form.setFieldsValue({ width: w, height: h });
        }
    };

    useEffect(() => {
        if (card && visible) {
            setPreviewCard(card);
            const config = card.parsedConfig || {};
            const bg = config.background || config.bgColor || '#ffffff';
            
            let currentBgType: 'color' | 'gradient' | 'image' = 'color';
            if (bg.startsWith('linear-') || bg.startsWith('radial-')) {
                currentBgType = 'gradient';
                form.setFieldValue('bgGradient', bg);
            } else if (bg.startsWith('url')) {
                currentBgType = 'image';
                const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
                form.setFieldValue('bgImage', match ? match[1] : '');
            } else {
                form.setFieldValue('bgColor', bg);
            }
            setBgType(currentBgType);

            form.setFieldsValue({
                title: card.title,
                width: card.width,
                height: card.height,
                textColor: config.textColor || '#000000',
                transparent: config.transparent ?? 0,
                // Specific configs
                is24Hour: config.is24Hour ?? true,
                targetDate: config.targetDate ? dayjs(config.targetDate) : undefined,
                target: config.target,
                city: config.city,
                showLunar: config.showLunar ?? true,
                fontSize: config.fontSize || 14,
                fontFamily: config.fontFamily || 'var(--font-family)',
            });
        }
    }, [card, visible, form]);

    const getBackgroundFromValues = (values: any, type: string) => {
        let background = values.bgColor;
        if (type === 'color') {
            background = typeof values.bgColor === 'string' ? values.bgColor : values.bgColor?.toHexString();
        } else if (type === 'gradient') {
            background = values.bgGradient;
        } else if (type === 'image') {
            background = `url('${values.bgImage}')`;
        }
        return background;
    };

    const handleValuesChange = (_changedValues: any, allValues: any) => {
        if (!previewCard) return;

        const background = getBackgroundFromValues(allValues, bgType);
        
        const newConfig = {
            ...previewCard.parsedConfig,
            background,
            bgColor: background,
            textColor: typeof allValues.textColor === 'string' ? allValues.textColor : allValues.textColor?.toHexString(),
            transparent: allValues.transparent,
            fontSize: allValues.fontSize,
            fontFamily: allValues.fontFamily,
            is24Hour: allValues.is24Hour,
            targetDate: allValues.targetDate ? allValues.targetDate.toISOString() : undefined,
            target: allValues.target,
            city: allValues.city,
            showLunar: allValues.showLunar,
        };

        setPreviewCard({
            ...previewCard,
            title: allValues.title,
            width: allValues.width,
            height: allValues.height,
            parsedConfig: newConfig
        });
    };

    const handleOk = async () => {
        if (!card) return;
        try {
            const values = await form.validateFields();
            const background = getBackgroundFromValues(values, bgType);

            const config = {
                ...card.parsedConfig,
                background,
                bgColor: background, // Keep for backward compatibility
                textColor: typeof values.textColor === 'string' ? values.textColor : values.textColor?.toHexString(),
                transparent: values.transparent,
                fontSize: values.fontSize,
                fontFamily: values.fontFamily,
                // Specific
                is24Hour: values.is24Hour,
                targetDate: values.targetDate ? values.targetDate.toISOString() : undefined,
                target: values.target,
                city: values.city,
                showLunar: values.showLunar,
            };

            await updateCard(card.id, values.title, config);
            await updateCardPosition(
                card.id,
                card.position_x,
                card.position_y,
                values.width,
                values.height
            );
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const renderSpecificConfig = () => {
        if (!card) return null;
        switch (card.type) {
            case CARD_TYPES.TIME:
                return (
                    <Form.Item name="is24Hour" label="24小时制" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                );
            case CARD_TYPES.COUNTDOWN:
                return (
                    <Form.Item name="targetDate" label="目标时间">
                        <DatePicker showTime />
                    </Form.Item>
                );
            case CARD_TYPES.HYDRATION:
                return (
                    <Form.Item name="target" label="每日目标 (杯)">
                        <InputNumber min={1} max={50} />
                    </Form.Item>
                );
            case CARD_TYPES.WEATHER:
                return (
                    <Form.Item name="city" label="城市">
                        <Input placeholder="输入城市名称 (如: Shanghai)" />
                    </Form.Item>
                );
            case CARD_TYPES.CALENDAR:
                return (
                    <Form.Item name="showLunar" label="显示农历" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            title="卡片设置"
            open={visible}
            onOk={handleOk}
            onCancel={onClose}
            destroyOnHidden
            width={900}
            centered
        >
            <div style={{ display: 'flex', gap: 24, height: 500 }}>
                {/* Preview Section */}
                <div style={{ 
                    flex: '0 0 400px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: '#f5f5f5',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #e8e8e8',
                        background: '#fff',
                        fontWeight: 500 
                    }}>
                        实时预览
                    </div>
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: 16,
                        overflow: 'hidden',
                        backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}>
                        <div style={{ 
                            transform: 'scale(0.85)', 
                            transformOrigin: 'center center',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
                        }}>
                           {previewCard && <PreviewCard card={previewCard} />}
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                        <Tabs items={[
                            {
                                key: 'basic',
                                label: '基础设置',
                                children: (
                                    <>
                                        <Form.Item name="title" label="标题">
                                            <Input />
                                        </Form.Item>
                                        
                                        <Form.Item label="卡片尺寸" name="sizePreset">
                                            <Segmented
                                                options={[
                                                    { label: '小 (200x150)', value: 'small' },
                                                    { label: '中 (300x200)', value: 'medium' },
                                                    { label: '大 (400x300)', value: 'large' },
                                                    { label: '自定义', value: 'custom' }
                                                ]}
                                                value={sizePreset}
                                                onChange={handleSizeChange}
                                            />
                                        </Form.Item>

                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <Form.Item name="width" label="宽度" style={{ flex: 1 }}>
                                                <InputNumber min={100} step={10} style={{ width: '100%' }} onChange={() => setSizePreset('custom')} />
                                            </Form.Item>
                                            <Form.Item name="height" label="高度" style={{ flex: 1 }}>
                                                <InputNumber min={50} step={10} style={{ width: '100%' }} onChange={() => setSizePreset('custom')} />
                                            </Form.Item>
                                        </div>
                                    </>
                                )
                            },
                            {
                                key: 'style',
                                label: '样式设置',
                                children: (
                                    <>
                                        <div style={{ marginBottom: 16 }}>
                                            <Form.Item label="背景类型" style={{ marginBottom: 8 }}>
                                                <Segmented 
                                                    options={[
                                                        { label: '纯色', value: 'color' },
                                                        { label: '渐变', value: 'gradient' },
                                                        { label: '图片', value: 'image' }
                                                    ]} 
                                                    value={bgType} 
                                                    onChange={(v) => {
                                                        setBgType(v as any);
                                                        // Trigger update when type changes
                                                        const currentValues = form.getFieldsValue();
                                                        handleValuesChange({}, currentValues);
                                                    }} 
                                                />
                                            </Form.Item>
                                            
                                            {bgType === 'color' && (
                                                <Form.Item name="bgColor" label="背景颜色">
                                                    <ColorPicker showText />
                                                </Form.Item>
                                            )}
                                            {bgType === 'gradient' && (
                                                <Form.Item name="bgGradient" label="渐变CSS">
                                                    <Input.TextArea placeholder="linear-gradient(to right, #ff0000, #0000ff)" autoSize={{ minRows: 2, maxRows: 4 }} />
                                                    <div style={{ marginTop: 8 }}>
                                                        <Typography.Text type="secondary">预设: </Typography.Text>
                                                        {['linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', 'linear-gradient(to top, #accbee 0%, #e7f0fd 100%)'].map(g => (
                                                            <div 
                                                                key={g} 
                                                                title={g}
                                                                style={{ display: 'inline-block', width: 24, height: 24, background: g, marginRight: 8, cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4, verticalAlign: 'middle' }}
                                                                onClick={() => {
                                                                    form.setFieldValue('bgGradient', g);
                                                                    handleValuesChange({}, form.getFieldsValue());
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </Form.Item>
                                            )}
                                            {bgType === 'image' && (
                                                <Form.Item name="bgImage" label="图片URL">
                                                    <Input placeholder="https://example.com/image.jpg" />
                                                </Form.Item>
                                            )}
                                        </div>

                                        <Form.Item label="文字颜色" name="textColor">
                                            <ColorPicker showText presets={[{ label: '预设', colors: presetColors }]} />
                                        </Form.Item>
                                        
                                        <Form.Item label="字体" name="fontFamily">
                                            <Select options={fontFamilies} />
                                        </Form.Item>

                                        <Form.Item label="字号" name="fontSize">
                                            <Slider min={10} max={48} marks={{ 12: '12', 14: '14', 24: '24', 36: '36', 48: '48' }} />
                                        </Form.Item>

                                        <Form.Item label="不透明度" name="transparent">
                                            <Slider min={0} max={100} tooltip={{ formatter: (value) => `${value}%` }} />
                                        </Form.Item>
                                    </>
                                )
                            },
                            {
                                key: 'data',
                                label: '数据配置',
                                children: renderSpecificConfig()
                            }
                        ]} />
                    </Form>
                </div>
            </div>
        </Modal>
    );
};
