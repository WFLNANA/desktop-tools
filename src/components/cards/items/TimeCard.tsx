import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Typography } from 'antd';
import { CardProps } from '../types';
import { useSmartInterval } from '../../../hooks/useSmartInterval';

export const TimeCard = React.memo<CardProps>(({ card }) => {
  const [time, setTime] = useState(dayjs());
  const config = card.parsedConfig || {};
  const is24Hour = config.is24Hour ?? true;

  useSmartInterval(() => {
    setTime(dayjs());
  }, 1000);

  const format = is24Hour ? 'HH:mm:ss' : 'h:mm:ss A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography.Title level={1} style={{ margin: 0, fontSize: 'var(--card-font-size, 3rem)', fontWeight: 'bold', color: 'inherit', fontFamily: 'var(--card-font-family)' }}>
        {time.format(format)}
      </Typography.Title>
      <Typography.Text style={{ fontSize: 'calc(var(--card-font-size, 3rem) * 0.4)', color: 'inherit', opacity: 0.6, fontFamily: 'var(--card-font-family)' }}>
        {time.format('YYYY年MM月DD日 dddd')}
      </Typography.Text>
    </div>
  );
});
