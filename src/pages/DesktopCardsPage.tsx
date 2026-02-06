import React from 'react';
import { CardManager } from '../components/cards/CardManager';

export const DesktopCardsPage: React.FC = () => {
  return (
    <div style={{ height: '100%', padding: '20px' }}>
      <CardManager />
    </div>
  );
};

export default DesktopCardsPage;
